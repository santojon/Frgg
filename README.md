# Frgg
Frigga (Frgg)

A simple way to compose html with many separated files.

## Usage

When thinking the html as a componized page, you can just create separeted files for each one.   
In main page file you can just add all components you want with an &ltscript&gt tag.   

Example:

 - component file (menu.html)
```html
<div>
    <h2>
        Menu
    </h2>
    <ul>
        <li>Item1</li>
        <li>Item2</li>
    </ul>
</div>
```

 - main file (index.html)
```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>Frgg test</title>
		<meta charset="UTF-8">
	</head>
	<body>
		<script type="text/frigga" src"path_to_html_components_dir/menu.html"></script>
		
        <!-- Add the library to the end of the page, to run after all other scripts -->
		<script type="text/javascript" src="path_to_frgg/frgg.js"></script>
	</body>
</html>
```

The result is an html page with all components replacing frigga script tags:   

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>Frgg test</title>
		<meta charset="UTF-8">
	</head>
	<body>
		<div>
            <h2>
                Menu
            </h2>
            <ul>
                <li>Item1</li>
                <li>Item2</li>
            </ul>
        </div>
		
        <!-- Add the library to the end of the page, to run after all other scripts -->
		<script type="text/javascript" src="path_to_frgg/frgg.js"></script>
	</body>
</html>
```

> **Note:** You have to use a server in the middle, or frigga *xhr* requests will fail.