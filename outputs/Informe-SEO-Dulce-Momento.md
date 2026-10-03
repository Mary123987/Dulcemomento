# Auditoría SEO · Dulce Momento

Entrega académica · 3 de octubre de 2026 · Proyecto revisado y optimizado en local. No se publicó, no se subió a GitHub y no se realizó ningún deploy.

28 páginas reales, 16 fichas de producto, 84 palabras clave candidatas y 28 decisiones. Se conservaron identidad visual, navegación, catálogo, personalización, carrito, checkout, confirmación y asistente.

## Cómo interpretar el análisis

No se dispone de datos de Keyword Planner, Search Console ni una herramienta de dificultad SEO. No se atribuyen volúmenes, porcentajes, tráfico ni competencia medidos. La viabilidad Alta/Media/Baja significa adecuación editorial a la página actual, no facilidad de posicionamiento. Relevancia Alta es coincidencia directa con su contenido; Media es parcial o demasiado amplia; Baja corresponde a otra intención. La especificidad y relación con el negocio se explican en el motivo de cada candidata. No posicionar significa que la página es una utilidad o documento de esta demo y no debe competir por tráfico orgánico.

La investigación combina el inventario real y una muestra cualitativa de lenguaje comercial: las consultas “kekes artesanales Lima”, “keke de chocolate / zanahoria Lima” y “kekes personalizados Lima” muestran usos de esas familias de términos en [Haku](https://www.haku.pe/index.html), [Dolcefina](https://postresdolcefina.com/kekes/) y [Sorprende Lima](https://www.sorprendelima.pe/en/collections/pasteleria/mini-cakes). Esto apoya su pertinencia lingüística; no demuestra volumen ni competitividad y no equivale a investigar individualmente 84 resultados de búsqueda. La selección definitiva es una hipótesis editorial para la demostración.

Indexable describe la configuración propuesta para una futura web pública. El sitio sigue en http://127.0.0.1:4173; no se puede afirmar que Google lo haya indexado. Canonical y sitemap usan ese origen local deliberadamente, pendiente de un dominio autorizado.

## Auditoría previa a las modificaciones

Se revisaron las vistas, datos, estilos, almacenamiento, generador, servidor, modelos, pruebas e imágenes antes de editar. Se conservó una copia de los seis archivos originales revisados en work/seo-before.

- Framework: ninguno. HTML, CSS y JavaScript con módulos ES; Node.js sirve archivos y genera las rutas.
- dist/app.js reúne header, footer, tarjetas, catálogo y filtros, fichas, carrito, checkout, confirmación, formularios y asistente por reglas. Navegación con History API y enlaces internos reales.
- dist/data.js contiene 16 productos y configuración; dist/store.js concentra precios, cupones y localStorage; models.d.ts describe estructuras.
- dist/style.css conserva tonos crema y terracota, tipografías Playfair Display y DM Sans, animaciones y puntos de adaptación móvil.
- Imágenes existentes: hero.png y mosaico products.png de 16 productos. El mosaico se recorta por coordenadas; no son fotografías verificadas de productos reales.
- Estado anterior: shell HTML vacío, metadata inicial genérica, contenido dependiente de JS y servidor que devolvía la raíz para rutas inexistentes. Ausentes canonical, robots, sitemap y metadatos sociales completos. H1 genéricos, enlaces de tarjetas poco descriptivos y alternativas de imágenes basadas en contenedores.
- Carrito, favoritos, cupón, pedido y solicitudes usan almacenamiento del navegador. No hay backend de pedidos ni pasarela real. Contacto no envía ni guarda; WhatsApp es un enlace independiente. Testimonios explícitamente ficticios.

## Inventario de las páginas existentes

Las rutas siguientes son relativas al origen local indicado arriba. Se identificaron antes de cambiar el contenido.

- **Inicio** — /. Tipo: Inicio comercial. Propósito: Presentar la marca, su propuesta artesanal y la orientación local a Lima. Decisión: index,follow; página pública.
- **Catálogo** — /catalogo. Tipo: Colección. Propósito: Explorar, buscar, filtrar y comparar los 16 productos. Decisión: index,follow; página pública.
- **Personalizados** — /personalizados. Tipo: Servicio y formulario. Propósito: Recoger una idea de diseño libre mediante un formulario especial. Decisión: index,follow; página pública.
- **Nosotros** — /nosotros. Tipo: Marca. Propósito: Explicar el concepto y los valores de la marca sin inventar trayectoria. Decisión: index,follow; página pública.
- **Contacto** — /contacto. Tipo: Contacto. Propósito: Presentar formulario simulado y canales de contacto separados. Decisión: index,follow; página pública.
- **Ayuda** — /ayuda. Tipo: Guía informativa. Propósito: Explicar entrega, recojo, plazos y pago en la demostración. Decisión: index,follow; página pública.
- **Carrito** — /carrito. Tipo: Transaccional interna. Propósito: Revisar y editar una selección local antes del checkout. Decisión: noindex,follow; fuera del sitemap.
- **Checkout** — /checkout. Tipo: Transaccional interna. Propósito: Capturar datos de prueba y finalizar la compra simulada. Decisión: noindex,follow; fuera del sitemap.
- **Confirmación** — /pedido-confirmado. Tipo: Resultado de transacción. Propósito: Mostrar el último pedido simulado del navegador. Decisión: noindex,follow; fuera del sitemap.
- **Favoritos** — /favoritos. Tipo: Lista personal. Propósito: Recuperar productos marcados localmente por el visitante. Decisión: noindex,follow; fuera del sitemap.
- **Términos** — /terminos. Tipo: Condiciones. Propósito: Explicar los límites de esta demostración académica. Decisión: noindex,follow; fuera del sitemap.
- **Privacidad** — /privacidad. Tipo: Privacidad. Propósito: Explicar almacenamiento local y permitir su borrado. Decisión: noindex,follow; fuera del sitemap.
- **Keke de chocolate** — /productos/keke-chocolate. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke de vainilla** — /productos/keke-vainilla. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke red velvet** — /productos/keke-red-velvet. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke de zanahoria** — /productos/keke-zanahoria. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke de fresa** — /productos/keke-fresa. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke de chocolate y fudge** — /productos/keke-chocolate-y-fudge. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke de limón** — /productos/keke-limon. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke de naranja** — /productos/keke-naranja. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke de tres leches** — /productos/keke-tres-leches. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke de chocolate blanco** — /productos/keke-chocolate-blanco. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke de frutos rojos** — /productos/keke-frutos-rojos. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke personalizado** — /productos/keke-personalizado. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Mini keke de chocolate** — /productos/keke-mini-chocolate. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Mini keke de vainilla** — /productos/keke-mini-vainilla. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke para cumpleaños** — /productos/keke-especial-para-cumpleanos. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.
- **Keke para aniversario** — /productos/keke-especial-para-aniversario. Tipo: Ficha de producto. Propósito: Consultar y configurar este producto específico antes de agregarlo al carrito. Decisión: index,follow; página pública.

Preguntas frecuentes existe como sección /#faq, no como /faq. /#como-funciona, /#testimonios y /ayuda#pagos también son secciones. Los filtros de /catalogo?ocasion=… y ?buscar=1 son estados de la colección, no páginas nuevas. El estado 404 no es una página comercial ni se incluye en el sitemap.

## Palabra clave principal y motivo por página

- **Inicio: kekes artesanales en Lima.** Combina el producto artesanal y la ubicación del flujo de entrega. El catálogo se centra en comparar sabores, no en presentar el negocio local.
- **Catálogo: catálogo de kekes artesanales.** Añade catálogo para diferenciar la colección de la propuesta local del inicio. Permite una introducción natural sin prometer ventas reales.
- **Personalizados: diseño de kekes personalizados.** El término diseño corresponde a una consulta abierta; la ficha de keke personalizado se ocupa de configurar y agregar una unidad al carrito.
- **Nosotros: Dulce Momento repostería artesanal.** La búsqueda de marca se resuelve con el concepto y los valores existentes, sin atribuir años de experiencia, premios o locales.
- **Contacto: contacto Dulce Momento.** Representa el formulario y todos los canales sin convertir la página en otra colección de productos.
- **Ayuda: delivery y recojo de kekes.** La intención de guía diferencia esta página de la propuesta comercial del inicio y del checkout operativo.
- **Carrito: carrito de compras Dulce Momento.** Se usa solo como etiqueta funcional. El estado es personal y local, por eso corresponde noindex.
- **Checkout: finalizar pedido Dulce Momento.** Etiqueta de la tarea de finalización. Noindex evita intentar posicionar un paso dependiente del carrito.
- **Confirmación: confirmación de pedido Dulce Momento.** Etiqueta descriptiva del comprobante local, sin objetivo orgánico. Noindex también se conserva cuando no hay pedido.
- **Favoritos: kekes favoritos Dulce Momento.** Es una etiqueta funcional, no una recomendación pública ni un ranking. Noindex evita indexar una lista vacía o variable.
- **Términos: términos de demostración Dulce Momento.** Se mantiene accesible y con título propio, pero noindex porque solo regula el alcance de la demo. Es una decisión de este proyecto, no una regla universal para páginas legales.
- **Privacidad: privacidad de datos Dulce Momento.** Etiqueta de transparencia de la demo. Se mantiene enlazada, pero no se orienta a captación orgánica ni se presenta como política final.
- **Keke de chocolate: keke de chocolate.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke de vainilla: keke de vainilla.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke red velvet: keke red velvet.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke de zanahoria: keke de zanahoria.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke de fresa: keke de fresa.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke de chocolate y fudge: keke de chocolate y fudge.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke de limón: keke de limón.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke de naranja: keke de naranja.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke de tres leches: keke de tres leches.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke de chocolate blanco: keke de chocolate blanco.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke de frutos rojos: keke de frutos rojos.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke personalizado: keke personalizado.** El singular representa una unidad configurable con precio y carrito. Se diferencia del servicio de diseño libre en /personalizados.
- **Mini keke de chocolate: mini keke de chocolate.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Mini keke de vainilla: mini keke de vainilla.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke para cumpleaños: keke para cumpleaños.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.
- **Keke para aniversario: keke para aniversario.** Corresponde al sabor o la ocasión de un único producto. El modificador específico lo diferencia del catálogo y de los otros kekes.

El inicio presenta la propuesta artesanal local; el catálogo organiza y compara productos; cada ficha responde al sabor u ocasión concreta. La consulta de diseño libre (/personalizados) se distingue del artículo configurable (/productos/keke-personalizado). Ayuda explica entrega y pago. Contacto y Nosotros responden a búsquedas de marca. Ninguna pareja comparte exactamente la misma palabra principal; esto reduce solapamientos planificados, pero no demuestra ausencia de canibalización real sin datos de búsquedas.

## TABLA 1 — ANÁLISIS DE PALABRAS CLAVE

Tres candidatas por cada página. En páginas noindex las candidatas sirven para explicar su función, no para promover su indexación.

| Página | URL | Palabra clave | Intención | Relevancia | Viabilidad | Motivo |
| --- | --- | --- | --- | --- | --- | --- |
| Inicio | / | kekes artesanales en Lima | Comercial | Alta | Alta | Une producto, elaboración y ubicación ya presentes en la entrega de demostración. |
| Inicio | / | repostería artesanal en Lima | Comercial | Media | Media | Es más amplia que el catálogo, que solo ofrece kekes. |
| Inicio | / | Dulce Momento | Navegacional | Alta | Media | Es útil como término de marca secundario; por sí solo no describe el producto. |
| Catálogo | /catalogo | catálogo de kekes artesanales | Comercial | Alta | Alta | Nombra exactamente la colección navegable y la tarea de comparación. |
| Catálogo | /catalogo | sabores de kekes | Informacional | Alta | Media | Describe la variedad, pero no distingue entre información y una colección de compra. |
| Catálogo | /catalogo | comprar kekes online | Transaccional | Media | Baja | El sitio permite simular compras, no recibir una venta real. |
| Personalizados | /personalizados | diseño de kekes personalizados | Comercial | Alta | Alta | El formulario pide tema, colores, personas y diseño libre. |
| Personalizados | /personalizados | keke personalizado | Transaccional | Alta | Media | Se reserva para la ficha con precio y agregado al carrito. |
| Personalizados | /personalizados | tortas personalizadas en Lima | Comercial | Media | Media | Es una variante de lenguaje, pero el negocio usa kekes y no un catálogo adicional de tortas. |
| Nosotros | /nosotros | Dulce Momento repostería artesanal | Navegacional | Alta | Alta | Conecta la identidad buscada con el contenido de la marca. |
| Nosotros | /nosotros | historia de Dulce Momento | Navegacional | Media | Media | La página explica el concepto, pero no existe una historia empresarial documentada. |
| Nosotros | /nosotros | pastelería artesanal en Lima | Comercial | Media | Baja | Es demasiado amplia y competiría con la intención local del inicio. |
| Contacto | /contacto | contacto Dulce Momento | Navegacional | Alta | Alta | Responde a quien busca contactar con este negocio concreto. |
| Contacto | /contacto | WhatsApp Dulce Momento | Navegacional | Alta | Media | Es un canal secundario; el formulario sigue siendo el contenido principal. |
| Contacto | /contacto | consulta sobre kekes | Comercial | Media | Media | Describe una necesidad, pero no identifica el negocio de destino. |
| Ayuda | /ayuda | delivery y recojo de kekes | Informacional | Alta | Alta | Une las dos modalidades explicadas en la misma guía. |
| Ayuda | /ayuda | cómo pagar en Dulce Momento | Informacional | Alta | Media | Coincide con la sección de pagos, pero no cubre toda la página. |
| Ayuda | /ayuda | delivery de kekes en Lima | Transaccional | Media | Media | Podría implicar disponibilidad comercial real; aquí se explican tarifas referenciales. |
| Carrito | /carrito | carrito de compras Dulce Momento | Navegacional | Alta | No posicionar | Etiqueta funcional del carrito, no objetivo de captación orgánica. |
| Carrito | /carrito | mi carrito Dulce Momento | Navegacional | Alta | No posicionar | Depende de los productos guardados en cada navegador. |
| Carrito | /carrito | comprar kekes | Transaccional | Baja | No posicionar | La búsqueda debe resolverse en el catálogo; no en un carrito vacío o personal. |
| Checkout | /checkout | finalizar pedido Dulce Momento | Transaccional | Alta | No posicionar | Describe la acción interna después de elegir productos. |
| Checkout | /checkout | pagar pedido Dulce Momento | Transaccional | Alta | No posicionar | Es una etapa de simulación, no una página para buscadores. |
| Checkout | /checkout | comprar keke con Yape | Transaccional | Baja | No posicionar | Forzaría captación hacia un formulario privado con pago simulado. |
| Confirmación | /pedido-confirmado | confirmación de pedido Dulce Momento | Navegacional | Alta | No posicionar | Describe el resultado particular de una transacción. |
| Confirmación | /pedido-confirmado | resumen de mi pedido Dulce Momento | Navegacional | Alta | No posicionar | El contenido cambia según el navegador y no es una respuesta pública. |
| Confirmación | /pedido-confirmado | seguimiento de pedido Dulce Momento | Navegacional | Media | No posicionar | El seguimiento existente es ilustrativo, no un servicio en vivo. |
| Favoritos | /favoritos | kekes favoritos Dulce Momento | Navegacional | Alta | No posicionar | Describe una selección privada del navegador. |
| Favoritos | /favoritos | mis kekes guardados | Navegacional | Alta | No posicionar | Es una utilidad personal sin una colección editorial estable. |
| Favoritos | /favoritos | mejores kekes artesanales | Comercial | Baja | No posicionar | Confundiría preferencias locales con una clasificación acreditada. |
| Términos | /terminos | términos de demostración Dulce Momento | Navegacional | Alta | No posicionar | Describe el documento existente sin presentarlo como contrato comercial definitivo. |
| Términos | /terminos | condiciones de compra Dulce Momento | Navegacional | Media | No posicionar | Aún no existen condiciones comerciales de una venta real. |
| Términos | /terminos | términos de una pastelería | Informacional | Baja | No posicionar | El documento no es una guía jurídica general. |
| Privacidad | /privacidad | privacidad de datos Dulce Momento | Navegacional | Alta | No posicionar | Identifica la información de privacidad de esta demostración. |
| Privacidad | /privacidad | eliminar datos Dulce Momento | Navegacional | Alta | No posicionar | Describe la herramienta de borrado, pero solo parte de la página. |
| Privacidad | /privacidad | política de privacidad de pastelería | Informacional | Baja | No posicionar | No es una plantilla jurídica reutilizable ni una política comercial definitiva. |
| Keke de chocolate | /productos/keke-chocolate | keke de chocolate | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke de chocolate | /productos/keke-chocolate | keke de chocolate artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke de chocolate | /productos/keke-chocolate | receta de keke de chocolate | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke de vainilla | /productos/keke-vainilla | keke de vainilla | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke de vainilla | /productos/keke-vainilla | keke de vainilla artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke de vainilla | /productos/keke-vainilla | receta de keke de vainilla | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke red velvet | /productos/keke-red-velvet | keke red velvet | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke red velvet | /productos/keke-red-velvet | keke red velvet artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke red velvet | /productos/keke-red-velvet | receta de keke red velvet | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke de zanahoria | /productos/keke-zanahoria | keke de zanahoria | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke de zanahoria | /productos/keke-zanahoria | keke de zanahoria artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke de zanahoria | /productos/keke-zanahoria | receta de keke de zanahoria | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke de fresa | /productos/keke-fresa | keke de fresa | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke de fresa | /productos/keke-fresa | keke de fresa artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke de fresa | /productos/keke-fresa | receta de keke de fresa | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke de chocolate y fudge | /productos/keke-chocolate-y-fudge | keke de chocolate y fudge | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke de chocolate y fudge | /productos/keke-chocolate-y-fudge | keke de chocolate y fudge artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke de chocolate y fudge | /productos/keke-chocolate-y-fudge | receta de keke de chocolate y fudge | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke de limón | /productos/keke-limon | keke de limón | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke de limón | /productos/keke-limon | keke de limón artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke de limón | /productos/keke-limon | receta de keke de limón | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke de naranja | /productos/keke-naranja | keke de naranja | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke de naranja | /productos/keke-naranja | keke de naranja artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke de naranja | /productos/keke-naranja | receta de keke de naranja | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke de tres leches | /productos/keke-tres-leches | keke de tres leches | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke de tres leches | /productos/keke-tres-leches | keke de tres leches artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke de tres leches | /productos/keke-tres-leches | receta de keke de tres leches | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke de chocolate blanco | /productos/keke-chocolate-blanco | keke de chocolate blanco | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke de chocolate blanco | /productos/keke-chocolate-blanco | keke de chocolate blanco artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke de chocolate blanco | /productos/keke-chocolate-blanco | receta de keke de chocolate blanco | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke de frutos rojos | /productos/keke-frutos-rojos | keke de frutos rojos | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke de frutos rojos | /productos/keke-frutos-rojos | keke de frutos rojos artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke de frutos rojos | /productos/keke-frutos-rojos | receta de keke de frutos rojos | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke personalizado | /productos/keke-personalizado | keke personalizado | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke personalizado | /productos/keke-personalizado | precio de keke personalizado | Comercial | Alta | Media | La ficha muestra importes y modificadores referenciales; no sustituye la consulta de diseño libre. |
| Keke personalizado | /productos/keke-personalizado | diseño de kekes personalizados | Informacional | Media | Baja | Corresponde al formulario de diseño de /personalizados; no debe duplicar su objetivo. |
| Mini keke de chocolate | /productos/keke-mini-chocolate | mini keke de chocolate | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Mini keke de chocolate | /productos/keke-mini-chocolate | mini keke de chocolate artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Mini keke de chocolate | /productos/keke-mini-chocolate | receta de mini keke de chocolate | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Mini keke de vainilla | /productos/keke-mini-vainilla | mini keke de vainilla | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Mini keke de vainilla | /productos/keke-mini-vainilla | mini keke de vainilla artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Mini keke de vainilla | /productos/keke-mini-vainilla | receta de mini keke de vainilla | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke para cumpleaños | /productos/keke-especial-para-cumpleanos | keke para cumpleaños | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke para cumpleaños | /productos/keke-especial-para-cumpleanos | keke para cumpleaños artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke para cumpleaños | /productos/keke-especial-para-cumpleanos | receta de keke para cumpleaños | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |
| Keke para aniversario | /productos/keke-especial-para-aniversario | keke para aniversario | Transaccional | Alta | Alta | Identifica exactamente el producto de esta ficha; la compra disponible es simulada. |
| Keke para aniversario | /productos/keke-especial-para-aniversario | keke para aniversario artesanal | Comercial | Alta | Media | Añade el atributo artesanal de la marca; se conserva como variante secundaria. |
| Keke para aniversario | /productos/keke-especial-para-aniversario | receta de keke para aniversario | Informacional | Baja | Baja | La página no enseña una receta ni cantidades de ingredientes. Se descarta por intención distinta. |

## TABLA 2 — DECISIÓN FINAL

H1 y Title corresponden a los valores implementados. Las URL conservan sus rutas originales para no romper enlaces.

| Página | URL | Palabra clave principal | H1 | Title | Indexación |
| --- | --- | --- | --- | --- | --- |
| Inicio | / | kekes artesanales en Lima | Kekes artesanales en Lima para cada momento. | Kekes artesanales en Lima \| Dulce Momento | index,follow · pública local |
| Catálogo | /catalogo | catálogo de kekes artesanales | Catálogo de kekes artesanales. | Catálogo de kekes artesanales \| Dulce Momento | index,follow · pública local |
| Personalizados | /personalizados | diseño de kekes personalizados | Diseño de kekes personalizados a tu manera | Diseño de kekes personalizados \| Dulce Momento | index,follow · pública local |
| Nosotros | /nosotros | Dulce Momento repostería artesanal | Dulce Momento: repostería artesanal con dedicación | Dulce Momento: repostería artesanal \| Nosotros | index,follow · pública local |
| Contacto | /contacto | contacto Dulce Momento | Contacto Dulce Momento: cuéntanos tu consulta | Contacto Dulce Momento \| Consultas y WhatsApp | index,follow · pública local |
| Ayuda | /ayuda | delivery y recojo de kekes | Delivery y recojo de kekes: guía de tu pedido | Delivery y recojo de kekes \| Ayuda Dulce Momento | index,follow · pública local |
| Carrito | /carrito | carrito de compras Dulce Momento | Tu carrito de compras | Carrito de compras \| Dulce Momento | noindex,follow |
| Checkout | /checkout | finalizar pedido Dulce Momento | Finaliza tu pedido | Finalizar pedido \| Dulce Momento | noindex,follow |
| Confirmación | /pedido-confirmado | confirmación de pedido Dulce Momento | Confirmación de tu pedido | Confirmación de pedido \| Dulce Momento | noindex,follow |
| Favoritos | /favoritos | kekes favoritos Dulce Momento | Tus kekes favoritos | Tus kekes favoritos \| Dulce Momento | noindex,follow |
| Términos | /terminos | términos de demostración Dulce Momento | Términos de la demostración | Términos de la demostración \| Dulce Momento | noindex,follow |
| Privacidad | /privacidad | privacidad de datos Dulce Momento | Privacidad de tus datos | Privacidad de tus datos \| Dulce Momento | noindex,follow |
| Keke de chocolate | /productos/keke-chocolate | keke de chocolate | Keke de chocolate | Keke de chocolate \| Dulce Momento | index,follow · pública local |
| Keke de vainilla | /productos/keke-vainilla | keke de vainilla | Keke de vainilla | Keke de vainilla \| Dulce Momento | index,follow · pública local |
| Keke red velvet | /productos/keke-red-velvet | keke red velvet | Keke red velvet | Keke red velvet \| Dulce Momento | index,follow · pública local |
| Keke de zanahoria | /productos/keke-zanahoria | keke de zanahoria | Keke de zanahoria | Keke de zanahoria \| Dulce Momento | index,follow · pública local |
| Keke de fresa | /productos/keke-fresa | keke de fresa | Keke de fresa | Keke de fresa \| Dulce Momento | index,follow · pública local |
| Keke de chocolate y fudge | /productos/keke-chocolate-y-fudge | keke de chocolate y fudge | Keke de chocolate y fudge | Keke de chocolate y fudge \| Dulce Momento | index,follow · pública local |
| Keke de limón | /productos/keke-limon | keke de limón | Keke de limón | Keke de limón \| Dulce Momento | index,follow · pública local |
| Keke de naranja | /productos/keke-naranja | keke de naranja | Keke de naranja | Keke de naranja \| Dulce Momento | index,follow · pública local |
| Keke de tres leches | /productos/keke-tres-leches | keke de tres leches | Keke de tres leches | Keke de tres leches \| Dulce Momento | index,follow · pública local |
| Keke de chocolate blanco | /productos/keke-chocolate-blanco | keke de chocolate blanco | Keke de chocolate blanco | Keke de chocolate blanco \| Dulce Momento | index,follow · pública local |
| Keke de frutos rojos | /productos/keke-frutos-rojos | keke de frutos rojos | Keke de frutos rojos | Keke de frutos rojos \| Dulce Momento | index,follow · pública local |
| Keke personalizado | /productos/keke-personalizado | keke personalizado | Keke personalizado | Keke personalizado \| Dulce Momento | index,follow · pública local |
| Mini keke de chocolate | /productos/keke-mini-chocolate | mini keke de chocolate | Mini keke de chocolate | Mini keke de chocolate \| Dulce Momento | index,follow · pública local |
| Mini keke de vainilla | /productos/keke-mini-vainilla | mini keke de vainilla | Mini keke de vainilla | Mini keke de vainilla \| Dulce Momento | index,follow · pública local |
| Keke para cumpleaños | /productos/keke-especial-para-cumpleanos | keke para cumpleaños | Keke para cumpleaños | Keke para cumpleaños \| Dulce Momento | index,follow · pública local |
| Keke para aniversario | /productos/keke-especial-para-aniversario | keke para aniversario | Keke para aniversario | Keke para aniversario \| Dulce Momento | index,follow · pública local |

## CAMBIOS REALIZADOS

- Fuente única dist/seo.js para decisiones, H1, títulos y descripciones únicos por las 28 rutas. Las 16 fichas derivan su SEO de los productos reales del catálogo.
- Introducciones de inicio, catálogo, personalización, contacto y marca ajustadas al objetivo de cada página; 16 descripciones de producto diferenciadas. Corregidos nombres como “Keke de Mini…” sin alterar identificadores, precios ni URL.
- Un H1 por página; H2/H3 ordenados para colección, carrito, personalización, confirmación y pie. Se mantiene el aspecto visual con clases y estilos existentes.
- Imágenes nativas con alt que describe el recorte mostrado, tamaño declarado y carga diferida en productos; imagen principal con prioridad alta. Se conserva el mosaico y el diseño.
- Textos de enlace específicos por producto y relacionados que priorizan su categoría. Se mantiene Inicio → Catálogo → Producto → Carrito → Checkout → Confirmación.
- HTML inicial con contenido y metadata por ruta usando las mismas vistas que la navegación del cliente. Google recomienda metadatos descriptivos y una implementación rastreable en aplicaciones JavaScript: [guía oficial](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
- Canonical limpio, sin parámetros, y metadata Open Graph/Twitter por página. Se usan para describir y consolidar variantes; no son garantías de posicionamiento: [canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- Sitemap con 22 páginas públicas; seis páginas noindex excluidas. robots.txt permite rastreo para que pueda leerse noindex; bloquear por robots no sustituye esa directiva: [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [robots](https://developers.google.com/search/docs/crawling-indexing/robots/intro), [sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- Schema.org descriptivo (WebPage, CollectionPage, AboutPage, ContactPage y BreadcrumbList); FAQPage solo para las preguntas visibles del inicio. No se añaden Product, Offer, Review ni AggregateRating con datos simulados. El marcado debe representar información veraz: [política oficial](https://developers.google.com/search/docs/appearance/structured-data/sd-policies). No se prometen resultados enriquecidos FAQ para una pastelería: [alcance de Google](https://developers.google.com/search/blog/2023/08/howto-faq-changes).
- Servidor con 404 real y noindex para rutas inexistentes; 308 para variantes /index.html y barra final. Limpieza de un controlador de contacto duplicado que era inalcanzable.

## PROBLEMAS ENCONTRADOS

- Corregidos: HTML inicial sin contenido, metadata genérica, H1 poco descriptivos, ausencias de canonical/sitemap/robots, alternativas de imágenes no nativas y rutas inexistentes respondidas como válidas.
- Algunos títulos H3 saltaban el segundo nivel. Se ajustó la jerarquía sin rediseñar componentes.
- No hay datos SEO medidos ni un dominio público confirmado. Se documenta la limitación sin inventar cifras o competencia.
- Las 16 fotos son recortes de un único recurso: los alt ayudan a interpretar las imágenes en la página, pero el archivo original sigue siendo un mosaico para búsqueda de imágenes.
- La disponibilidad, testimonios, precios y experiencia de compra son simulados. No deben convertirse en evidencia comercial ni reseñas estructuradas reales.

## PENDIENTES

- Antes de una publicación futura autorizada: confirmar dominio HTTPS, cambiar SEO_ORIGIN, regenerar páginas y verificar estados HTTP, canonical y sitemap en ese dominio. No enviar el sitemap local a Google.
- Validar titularidad de contactos/redes, punto de recojo, ingredientes, precios, disponibilidad y condiciones reales. Sustituir testimonios por opiniones verificadas si se desea usar reseñas reales.
- Obtener fotos individuales por producto y una imagen social específica; actualmente Open Graph/Twitter incluye texto y URL, sin imagen social dedicada.
- Tras un lanzamiento: verificar Search Console, consultas, impresiones, clics, indexación y métricas de experiencia real. Replantear keywords a partir de esa evidencia. No se afirma una puntuación Lighthouse ni Core Web Vitals medidos.
- Evaluar Product/Offer y políticas comerciales únicamente cuando exista una operación real y datos verificables. Revisar la decisión noindex de las páginas legales al reemplazar los textos académicos por los definitivos.

## Verificación y guía de la demostración

- Generación sin dependencias: node prepare-routes.mjs. Sintaxis: node --check dist/app.js. Cálculos y almacenamiento: node check.mjs. SEO estático: node check-seo.mjs. HTTP con servidor iniciado: node check-http.mjs.
- Pruebas de archivos: 28 rutas, títulos/descripciones distintos, un H1, metadatos, schema válido, enlaces internos, alt y dimensiones, 22 entradas en sitemap y exclusiones noindex.
- Pruebas HTTP: las 28 páginas contienen HTML inicial propio; robots y sitemap responden; rutas inexistentes devuelven 404; variantes normalizadas devuelven 308; filtros apuntan al canonical del catálogo.
- Navegador: visita a las 28 rutas incluidas las 16 fichas, comprobación de title, descripción, H1, canonical y robots. Compra simulada: 2 kekes de chocolate medianos, decoración especial, subtotal S/ 190, DULCE10 resta S/ 19, Surco suma S/ 18, total S/ 189 en checkout y confirmación. Carrito y cupón permanecen tras recargar.
- Comprobadas validaciones de checkout vacío, controles de tarjeta y Yape, y disponibilidad de pago al recoger solo con recojo. Asistente recomienda chocolate y agrega un producto al carrito global; buscador y favoritos responden. Consola sin errores ni advertencias durante las comprobaciones. Inicio y menú revisados a 390 × 844 px, sin desbordamiento horizontal; escritorio revisado con el ancho normal del navegador.
- La evidencia verificable se guarda en verificacion-seo.json, verificacion-http.json y verificacion-navegador.json, junto a capturas de revisión visual.

Para explicar al profesor: empezar por Inicio y su intención comercial local; abrir Catálogo y explicar la intención de comparación; entrar a una ficha y mostrar su palabra específica; recorrer el flujo simulado y explicar por qué carrito, checkout y confirmación son noindex. Mostrar las tablas para justificar candidatas descartadas (por ejemplo, “receta de…” no corresponde a una ficha de compra).

## Referencias técnicas consultadas

- [Google Search Central: SEO para JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google Search Central: SEO para desarrolladores](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [Google Search Central: Noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google Search Central: Robots.txt y sus límites](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Google Search Central: Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google Search Central: Canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google Search Central: Políticas de datos estructurados](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google Search Central: Alcance de resultados enriquecidos FAQ](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
