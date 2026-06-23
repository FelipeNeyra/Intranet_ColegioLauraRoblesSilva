Este proyecto fue creado con [Next.js](https://nextjs.org), con el parámetro [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Iniciar Proyecto

Correr en CMD y en ruta de almacenamiento los siguientes comandos:

```bash
npm install
# luego
npm run dev
# o
yarn dev
# o
pnpm dev
# o
bun dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador para ver.

## Explicación de Modulos

- Iniciar Sesión:
Permite y valida el ingreso de creedenciales de usuario (Correo y Contraseña) para determinar el
usuario que ingrese, ya sea un administrador o profesor, y redirigirlo a su apartado correspondiente.
Mediante el uso de AuthContext se verifica si ya existe una sesión iniciada con anterioridad, lo que
impide el ingreso desde otras rutas y mantiene la sesión iniciada incluo tras cerrar la página.

- Panel de Administración:
Permite el registro, modificación, eliminación de estudiantes, cursos y profesores. 
A su vez, permite la asignación de un curso a un profesor.
Integra un panel de reservas para sala de computación, el cual permite la búsqueda, el 
establecimiento y aprobación de reservas y bloqueos de un horario de un día específico.

- Panel de Profesores:
Permite el establecimiento de notas y citas de apoderados a los alumnos pertenecientes
al curso que tiene asignado. Se implementa, de igual forma, un panel de reservas para 
sala de computación el cuál permite hacer solicitudes de reservas para un horario y dias
establecidos.