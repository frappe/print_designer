# Decorator to monitor memory and CPU usage of a subprocess and save to a file
import functools
import os
import platform
import statistics
import time

import frappe
import psutil


def monitor_subprocess_usage(output_file="chrome_process_usage.json", interval=1):
	"""
	Decorator to monitor memory and CPU usage of a subprocess and save the data to a file.

	:param output_file: The file to save resource usage data.
	:param interval: Time in seconds between usage checks.
	"""

	def decorator(popen_func):
		@functools.wraps(popen_func)
		def wrapper(*args, **kwargs):
			# Call the original Popen function to create the subprocess
			process = popen_func(*args, **kwargs)
			pid = process.pid

			# Use psutil to track the subprocess
			proc = psutil.Process(pid)

			# Initialize list to store the usage data
			usage_data = {}

			# Monitor memory and CPU usage of the subprocess in a separate thread
			is_pss_supported = platform.system() == "Linux"  # pss is supported only on Linux

			def monitor():
				try:
					while process.poll() is None:  # Check if process is still running
						memory_info = proc.memory_info()
						cpu_percent = proc.cpu_percent(interval=interval)  # Get CPU percent
						rss = memory_info.rss / (1024 * 1024)  # Convert RSS to MB
						vms = memory_info.vms / (1024 * 1024)  # Convert VMS to MB
						# Check platform for PSS availability
						if is_pss_supported:
							pss = memory_info.pss / (1024 * 1024)  # Convert RSS to MB

						timestamp = time.time()

						if is_pss_supported:
							print(
								f"Process {pid} - Memory Usage: RSS={rss:.2f}MB, PSS={pss:.2f}MB, CPU Usage={cpu_percent}%"
							)
						else:
							print(f"Process {pid} - Memory Usage: RSS={rss:.2f}MB, CPU Usage={cpu_percent}%")

						# Collect the data
						usage_data.update(
							{"timestamp": timestamp, "cpu_percent": cpu_percent, "rss": rss, "vms": vms}
						)
						if is_pss_supported:
							usage_data["pss"] = pss

						# Write data to file in append mode
						with open(output_file, "a") as f:
							frappe.json.dump(usage_data, f)
							f.write("\n")

						time.sleep(interval)
				except psutil.NoSuchProcess:
					print(f"Process {pid} has terminated.")
				except Exception as e:
					print(f"Error during resource monitoring: {e}")

			# Start monitoring the resource usage in a separate thread
			import threading

			monitor_thread = threading.Thread(target=monitor, daemon=True)
			monitor_thread.start()

			return process

		return wrapper

	return decorator


# Function to summarize the resource usage data from the JSON file
def summarize_usage_data(output_file="chrome_process_usage.json"):
	if not os.path.exists(output_file):
		print("No data file found.")
		return

	with open(output_file, "r") as f:
		data = [frappe.json.loads(line.strip()) for line in f.readlines()]

	if not data:
		print("No data available to summarize.")
		return

	# Extract CPU, RSS, and VMS data for summary
	cpu_data = [entry["cpu_percent"] for entry in data]
	rss_data = [entry["rss"] for entry in data]
	vms_data = [entry["vms"] for entry in data]

	# Calculate min, max, average, and median
	summary = {}

	summary["avg_cpu"] = sum(cpu_data) / len(cpu_data)
	summary["min_cpu"] = min(cpu_data)
	summary["max_cpu"] = max(cpu_data)
	summary["median_cpu"] = statistics.median(cpu_data)

	summary["avg_rss"] = sum(rss_data) / len(rss_data)
	summary["min_rss"] = min(rss_data)
	summary["max_rss"] = max(rss_data)
	summary["median_rss"] = statistics.median(rss_data)
	if "pss" in data[0]:
		pss_data = [entry["pss"] for entry in data]
		summary["avg_pss"] = sum(pss_data) / len(pss_data)
		summary["min_pss"] = min(pss_data)
		summary["max_pss"] = max(pss_data)
		summary["median_pss"] = statistics.median(pss_data)
	else:
		summary["avg_pss"] = "Not Availeble (e.g. Macos)"
		summary["min_pss"] = "Not Availeble (e.g. Macos)"
		summary["max_pss"] = "Not Availeble (e.g. Macos)"
		summary["median_pss"] = "Not Availeble (e.g. Macos)"

	summary["avg_vms"] = sum(vms_data) / len(vms_data)
	summary["min_vms"] = min(vms_data)
	summary["max_vms"] = max(vms_data)
	summary["median_vms"] = statistics.median(vms_data)

	# Print the summary
	print(f"Summary of resource usage:")
	print(f"Total data points: {len(data)}")
	print(f"Average CPU Usage: {summary['avg_cpu']:.2f}%")
	print(f"Min CPU Usage: {summary['min_cpu']:.2f}%")
	print(f"Max CPU Usage: {summary['max_cpu']:.2f}%")
	print(f"Median CPU Usage: {summary['median_cpu']:.2f}%")

	print(f"Average RSS Memory: {summary['avg_rss']:.2f} MB")
	print(f"Min RSS Memory: {summary['min_rss']:.2f} MB")
	print(f"Max RSS Memory: {summary['max_rss']:.2f} MB")
	print(f"Median RSS Memory: {summary['median_rss']:.2f} MB")

	print(f"Average RSS Memory: {summary['avg_rss']:.2f} MB")
	print(f"Min RSS Memory: {summary['min_rss']:.2f} MB")
	print(f"Max RSS Memory: {summary['max_rss']:.2f} MB")
	print(f"Median RSS Memory: {summary['median_rss']:.2f} MB")

	print(f"Average VMS Memory: {summary['avg_vms']:.2f} MB")
	print(f"Min VMS Memory: {summary['min_vms']:.2f} MB")
	print(f"Max VMS Memory: {summary['max_vms']:.2f} MB")
	print(f"Median VMS Memory: {summary['median_vms']:.2f} MB")
