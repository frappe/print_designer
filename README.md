# Print Designer
<div align="center" markdown="1">

![ Print Designer Logo ](print_designer/public/images/print-designer-logo.svg)

</div>
<div align="center" markdown="1" >

## Frappe app to design print formats using interactive UI.

![](https://github.com/frappe/print_designer/assets/39730881/aa62d2e2-e25e-4803-afbc-d3eaf1e4840f)

</div>

## Features and How to Guides
<details>
<summary><h4>Create Print Format</h4></summary>

#### Using Awesomebar

https://github.com/frappe/print_designer/assets/39730881/913649cf-84f6-4284-b373-0997aaa3e356

#### Using Print Page

https://github.com/frappe/print_designer/assets/39730881/502a3e29-8bb5-4ec7-bfda-eaa85505acec
</details>
<details>
<summary><h4>Static & Dynamic Image</h4></summary>

#### Static Image

https://github.com/frappe/print_designer/assets/39730881/4d73d720-2de4-4d0a-9435-f924b8de3b7e

#### Dynamic Image

https://github.com/frappe/print_designer/assets/39730881/c22df30b-9e91-4e1c-9a73-51d85c149412

</details>
<details>
<summary><h4>Static & Dynamic Text</h4></summary>

#### Dynamic Text

https://github.com/frappe/print_designer/assets/39730881/e1c5a970-8df4-443d-828f-a5513fad41df

#### Static Text

https://github.com/frappe/print_designer/assets/39730881/de629a8e-fbec-4449-8e03-f08346ffe460

</details>
<details>
<summary><h4>Rectangle & Layouts</h4></summary>

#### Rectangle

https://github.com/frappe/print_designer/assets/39730881/cc3e64ce-285d-4a60-b249-a4b6dd4d2ce0

</details>
<details>
<summary><h4>Child Table</h4></summary>

https://github.com/frappe/print_designer/assets/39730881/b9cb5db7-1336-475c-9d82-d20c3a6a903e

</details>

## Installation
> **Warning**
>
> Please note that print designer is only compatible with develop and V15 version of frappe framework.
### Local

To setup the repository locally follow the steps mentioned below:

1. Install bench and setup a `frappe-bench` directory by following the [Installation Steps](https://frappeframework.com/docs/user/en/installation)
2. Start the server by running 
```
bench start
```
3. In a separate terminal window, create a new site by running 
```
bench new-site print-designer.test
```
4. Map your site to localhost with the command 
```
bench --site print-designer.test add-to-hosts
```
5. Get the Print Designer app
```
bench get-app https://github.com/frappe/print_designer
```
6. Install the app on the site. 
```
bench --site print-designer.test install-app print_designer
```
7.  Open [http://print-designer.test:8000/](http://print-designer.test:8000/) in your browser and go through the setup wizard. 

8.  After the setup is complete now open [http://print-designer.test:8000/app/print-designer/](http://print-designer.test:8000/app/print-designer/)
---
## Contributions and Community

There are many ways you can contribute even if you don't code:

1. You can start by giving a star to this repository!
1. If you find any issues, even if it is a typo, you can [raise an issue](https://github.com/frappe/print_designer/issues/new) to inform us.

---

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

## License

[GNU Affero General Public License v3.0](license.txt)
