<div align="center">

<a href="https://frappe.io/print-designer">
    <img src="https://github.com/frappe/print_designer/blob/develop/print_designer/public/images/print-designer-logo.svg" height="80" alt="Print Designer Logo">
</a>


<h1>Print Designer</h1>

**Frappe app to design print formats using interactive UI.**


![GitHub release (latest by date)](https://img.shields.io/github/v/release/frappe/print_designer)

<div>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/b008b238-bd07-497b-ae1f-83d58600e0ca">
        <img width="1402" alt="Print Designer Screenshot" src="https://github.com/user-attachments/assets/b008b238-bd07-497b-ae1f-83d58600e0ca">
    </picture>
</div>

[Website](https://frappe.io/print-designer) - [Documentation](https://docs.frappe.io/print-designer)
</div>

## Print Designer

Print Designer is an open-source designing tool that allows businesses to create dynamic and professional-looking print formats. If you are looking to design print formats that enhance your brand image and streamline operational efficiency, then give it a try.


### Motivation

Frappe Framework and ERPNext have everything included, meaning you have all you need, including print format builder. This is easy to use, and you can easily create basic formats. If you need more customisable formats with complex layouts and alignment, you must create a custom format with code, which can take days or weeks.

As everything at Frappe follows a UI-first approach, why not have a way to design complex formats from the UI without any coding? Having used Adobe Illustrator, Photoshop, XD, and Figma in the past, I wanted to create a tool that would allow users to have a very high level of freedom to customize it just the way they like it. It initially started as a side project. After gaining some initial traction, I started working on it full-time. Our vision is to enable users to create all kinds of complex print formats from invoices to product brochures If you are looking for a one-stop solution for this, we welcome you to try the Print Designer.

### Key Features

- ✨ **Intuitive Visual Designer:** Make formats with intuitive visual interface and get realtime feedback.
- 📱 **Dynamic Data Integration:** Add and automatically populate data to your print format from selected document and all of its linked documents.
- 🛠️ **Table Editor:** Easily create and modify your table designs with visual feedback.
- 🧑‍💻 **Scripting Capabilities:** Power users can add custom data or custom html elements.
- 📄 **Multi Page:** Design multiple pages and create even more complex designs.

### Under the Hood

- [Frappe Framework](https://github.com/frappe/frappe): A full-stack web application framework.


## Getting Started (Production)

> **Warning**
>
> Please note that print designer is only compatible with develop and V15 version of frappe framework.

### Managed Hosting

Get started with your personal or business site with a few clicks on Frappe Cloud - our official hosting service.
<div>
	<a href="https://frappecloud.com/marketplace/apps/print_designer" target="_blank">
		<picture>
			<source media="(prefers-color-scheme: dark)" srcset="https://frappe.io/files/try-on-fc-white.png">
			<img src="https://frappe.io/files/try-on-fc-black.png" alt="Try on Frappe Cloud" height="28" />
		</picture>
	</a>
</div>


### Self Hosting

Follow these steps to set up Print Designer in production:

**Step 1**: Download the easy install script

```bash
wget https://frappe.io/easy-install.py
```

**Step 2**: Run the deployment command

```bash
python3 ./easy-install.py deploy \
    --project=pd_prod_setup \
    --email=email@example.com \
    --image=ghcr.io/frappe/print_designer \
    --version=stable \
    --app=print_designer \
    --sitename subdomain.domain.tld
```

Replace the following parameters with your values:
- `email@example.com`: Your email address
- `subdomain.domain.tld`: Your domain name where print designer will be hosted

The script will set up a production-ready instance of Print Designer with all the necessary configurations in about 5 minutes.

## Getting Started (Development)

### Docker

You need Docker, docker-compose and git setup on your machine. Refer [Docker documentation](https://docs.docker.com/). After that, run following command:

**Step 1**: Setup folder and download the required files

```bash
mkdir frappe-pd && cd frappe-pd
wget -O docker-compose.yml https://raw.githubusercontent.com/frappe/print_designer/develop/docker/docker-compose.yml
wget -O init.sh https://raw.githubusercontent.com/frappe/print_designer/develop/docker/init.sh
```

**Step 2**: Run the container

```bash
docker compose up
```

Wait until the setup script creates a site and you see `Current Site set to print-designer.localhost` in the terminal. Once done, the site [http://print-designer.localhost:8000](http://print-designer.localhost:8000) should now be available.

**Credentials:**
Username: `Administrator`
Password: `admin`

## Getting Started (Development)

### Local Setup

1. [Setup Bench](https://docs.frappe.io/framework/user/en/installation).
1. In the frappe-bench directory, run `bench start` and keep it running.
1. Open a new terminal session and cd into `frappe-bench` directory and run following commands:
```bash
bench get-app print_designer
bench new-site print-designer.localhost --install-app print_designer
bench browse print-designer.localhost --user Administrator
```
1. Access the print designer page at `print-designer.localhost:8000/app/print-designer` in your web browser.


## FAQ
1. Incorrect PDF Page Size

    - Frappe / Print Designer requires at least  [version 0.12.5 with patched qt](https://frappeframework.com/docs/v14/user/en/installation#pre-requisites)

    - Install correct version by following [installation guide](https://frappeframework.com/docs/v14/user/en/installation) and confirm : 

    ```
    wkhtmltopdf --version
    ```
    - output should be similar to `wkhtmltopdf 0.12.6 (with patched qt)`


2. Mac Installation Error
    - If error has `npm ERR! node-pre-gyp WARN Pre-built binaries not found for canvas@x.x.x` it means that there aren't any pre-built binaries for your system so it will try to compile them and in order to do that you need 
    - Xcode Command Line Tools `xcode-select --install`
    - [HomeBrew](https://brew.sh/) and `brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman`
    - If you have **xcode 10.0 or higher** installed, in order to build from source you need **NPM 6.4.1 or higher** `npm install -g npm@latest`.

3. Linux ARM CPU Installation Error
    - If error has `node-pre-gyp WARN Pre-built binaries not installable for canvas@x.x.x and node@x.x.x` it means that there aren't any pre-built binaries for your system so it will try to compile them
    - In order to do that you need `sudo apt-get update && sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

<br>

## Links

- [Telegram Public Group](https://t.me/+beFRbDSDEgtjYmY9)
- [Discuss Forum](https://discuss.frappe.io/c/print-designer/84)
- [Documentation](https://docs.frappe.io/print_designer)


<br>
<div align="center">
	<a href="https://frappe.io" target="_blank">
		<picture>
			<source media="(prefers-color-scheme: dark)" srcset="https://frappe.io/files/Frappe-white.png">
			<img src="https://frappe.io/files/Frappe-black.png" alt="Frappe Technologies" height="28"/>
		</picture>
	</a>
</div>
