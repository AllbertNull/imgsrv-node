# Documentación relacionada con los endpoints y la forma de transformar imagenes

## Transformación de imagenes:

Se le pasa el parametro `[id_imagen]` al enlace de transformación el cual contiene la ruta de la imagen correspondiente "**/static/images/**".

```
GET http://localhost:3000/cdn-cgi/image/fit=cover,format=avif,quality=85,width=1920/[id_imagen]
```


los datos se pasan de la siguiente manera.

```
[
	{
		"id_image": "7RxYhDPQ",
		"image_path": "keyart/7RxYhDPQ.png",
		"description": "",
		"update_at": date.now(),
		"create_at": date.now()
	}
]
```

se genera un `id_image` unico de 8 digitos para reconocer la imagen a transformar.   
luego se agrega el `image_path` de la subcapeta donde se encuentra, en este caso seria **"/keyart"**.   
la descripción no es tan nesesaria de momento ya que no se requiere en nada, pero a futuro puede servir para algunas cosas   

## Autenticación:
para acceder a la pagina para agregar datos nuevos es nesesario iniciar sesion

```
POST http://localhost:3000/admin/login
Body: {
	"username": "username",
	"password": "password-seguro"
}
```

## Administrar Mapeos

para administrar el mapeo de imagenes se requiere el API-Token

```
GET http://localhost:3000/admin/mappings
Authorization: Bearer <token>

POST http://localhost:3000/admin/mappings
Authorization: Bearer <token>
Body: {
	"id_imagen": "NEWID",
	"image_path": "subcarpeta/imagen.png",
	"description": "Nueva Imagen",
	"update_at": date.now(),
	"create_at": date.now()
}
```

al crear un nuevo item es nesesario, (si ya se inicializo el servidor con `npm start` o `npm run dev`), detener el servidor y volverlo a levantar nuevamente, luego comprobar con la nueva `id_imagen` que la imagen se agrego correctamente.