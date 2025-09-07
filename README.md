# Servidor para gestión y optimización de Imágenes
se creo con el fin de crear un servidor cdn propio con optimizaciones para la web
>( de momento solo funciona con imagenes, proximamente se agregaran funciones para optimizar video y que funcionen formatos como mkv y otros tipos en la web )

**para inicializar el proyecto**
```
npm run build
```   
luego solo seria correr el servidor
```
npm start
```
o para correrlo en modo entorno de desarrollo
```
npm run dev
```

El servidor corre en el `localhost:3000`   
para ver las imagenes sigue el siguiente enlace
```
http://localhost:3000/cdn-cgi/image/fit=cover,format=avif,quality=85,width=1920/keyart/{tu imagen}
```
