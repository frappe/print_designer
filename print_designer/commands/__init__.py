import click


@click.command("setup-chrome", help="setup chrome (server-side) for pdf generation")
def setup_chorme():
	from print_designer.install import setup_chromium

	setup_chromium()


commands = [setup_chorme]
