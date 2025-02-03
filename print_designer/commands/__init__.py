import click


@click.command("setup-new-pdf-backend")
def setup_new_backend():
	from print_designer.install import setup_chromium

	setup_chromium()


commands = [setup_new_backend]
