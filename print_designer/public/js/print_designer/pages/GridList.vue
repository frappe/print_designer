<template>
	<div class="grid-list-body">
		<div class="image-filter">
			<input
				type="search"
				class="form-control input-sm col-10"
				:placeholder="__('Search by filename, URL or DocType')"
				v-model="search_text"
				@input="frappe.utils.debounce(searchPrintFormats(), 300)"
			/>
			<div class="col-2 action-btn">
				<button
					class="btn btn-secondary"
					@click="installerMode = !installerMode"
					v-html="
						installerMode
							? frappe.utils.icon('es-line-filetype', 'sm m-1') + ' View Formats'
							: frappe.utils.icon('es-line-download', 'sm m-1') + ' Install Formats'
					"
				></button>
			</div>
		</div>
		<div class="image-file-grid" v-if="!installerMode">
			<div
				class="file-wrapper ellipsis"
				v-for="pf in print_formats"
				:key="pf.name"
				@click="frappe.set_route('print-designer', pf.name)"
			>
				<div class="file-body">
					<div class="file-image">
						<img
							draggable="false"
							v-if="pf.print_designer_preview_img"
							:src="pf.print_designer_preview_img"
							:alt="pf.name"
						/>
						<div class="fallback-image" v-else>
							<div class="content">
								<div
									draggable="false"
									style="margin-bottom: 0.5rem"
									v-html="frappe.utils.icon('image', 'lg')"
								></div>
								<span>Preview Not Available</span>
							</div>
						</div>
					</div>
				</div>
				<div class="file-footer">
					<div style="width: 90%">
						<div class="file-title ellipsis">
							{{ pf.name }}
						</div>
						<div class="file-modified">{{ pf.doc_type }}</div>
						<div class="file-modified" v-html="get_modified_date(pf)"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onBeforeMount } from "vue";
import { useMainStore } from "../store/MainStore";
const print_formats = ref([]);
const search_text = ref("");
const installerMode = ref(false);
const MainStore = useMainStore();

const searchPrintFormats = async () => {
	if (search_text.value === "" || search_text.value.length < 3) {
		await fetch_print_formats();
	}
	let filters = {
		print_designer: ["=", "1"],
		name: ["like", `%${search_text.value}%`],
	};
	await fetch_print_formats(filters);
};

const fetch_print_formats = async (filters = null) => {
	const fields = [
		"name",
		"standard",
		"modified",
		"print_designer_preview_img",
		"disabled",
		"doc_type",
		"print_designer_template_app",
	];
	if (!filters) {
		filters = { print_designer: ["=", "1"] };
	}
	const pf = await frappe.db.get_list("Print Format", { fields, filters });
	pf && (print_formats.value = pf);
};
onBeforeMount(async () => await fetch_print_formats());

const get_modified_date = (pf) => {
	const [date] = pf.modified.split(" ");
	let modified_on;
	if (date === frappe.datetime.now_date()) {
		// attached to window in desk
		modified_on = comment_when(pf.modified);
	} else {
		modified_on = frappe.datetime.str_to_user(date);
	}
	return modified_on;
};
</script>

<style lang="scss" scoped>
.grid-list-body {
	height: 90%;
	width: 90%;
	margin: auto;
	overflow: auto;
	padding: 0;
	background-color: var(--fg-color);
}

.grid-list-body::-webkit-scrollbar {
	width: 5px;
	height: 5px;
}

.grid-list-body::-webkit-scrollbar-thumb {
	background: "var(--gray-200)";
	border-radius: 6px;
}

.grid-list-body::-webkit-scrollbar-track,
.grid-list-body::-webkit-scrollbar-corner {
	background: var(--fg-color);
}

.icon-show {
	display: none;
}

.image-filter {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: var(--margin-xl) 10px;

	.action-btn {
		padding: 0;
		display: flex;
		justify-content: flex-end;
	}
}

.image-file-grid {
	padding: var(--padding-sm);
	display: grid;
	grid-template-rows: repeat(auto-fill, minmax(300px, 1fr));
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	grid-gap: var(--margin-md);
	max-width: 100%;

	.file-wrapper {
		position: relative;
		cursor: pointer;
		height: 300px;
		max-height: 300px;
		display: flex;
		justify-content: space-between;
		flex-direction: column;
		width: 100%;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		text-decoration: none;

		.file-body {
			height: 205px;
			min-height: 205px;
			max-height: 205px;
			display: flex;
			align-items: center;
			flex-direction: row;
			background: var(--subtle-fg);

			.file-image {
				max-height: 100%;
				display: flex;
				width: 100%;
				min-width: 100%;

				img {
					object-fit: contain;
				}
			}
		}

		.file-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: var(--padding-md);
			background-color: var(--fg-color);

			.file-title {
				font-size: var(--text-md);
				font-weight: 500;
			}

			.file-modified {
				font-size: var(--text-xs);
				word-wrap: break-word;
				color: var(--text-on-gray);
			}
		}
	}

	.file-wrapper:hover {
		img {
			filter: opacity(75%);
		}
	}

	.selected-image {
		border: 1px solid var(--primary);
		border-radius: var(--border-radius);

		.icon-show {
			display: unset;
			font-size: 0.9rem;
			color: var(--primary);
		}
	}
}

.fallback-image {
	width: 100%;
	user-select: none;
	height: 100%;
	display: flex;
	word-wrap: break-word;
	align-items: center;
	justify-content: center;
	background-color: var(--subtle-fg);

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		span {
			font-size: smaller;
			text-align: center;
		}
	}
}
</style>
