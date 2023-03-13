var $ = go.GraphObject.make;

// Diagrama que recibirá los nodos y enlaces
var diagrama = $(go.Diagram, "divDiagrama",
	{
		"draggingTool.dragsLink": true,
		"draggingTool.isGridSnapEnabled": true,
		"linkingTool.isUnconnectedLinkValid": true,
		"linkingTool.portGravity": 10,
		"relinkingTool.isUnconnectedLinkValid": true,
		"relinkingTool.portGravity": 10,
		"relinkingTool.fromHandleArchetype":
		$(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(6, 6), fill: "tomato", stroke: "darkred" }),
		"relinkingTool.toHandleArchetype":
		$(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(6, 6), fill: "darkred", stroke: "tomato" }),
		"linkReshapingTool.handleArchetype":
		$(go.Shape, "Diamond", { desiredSize: new go.Size(5, 5), fill: "lightblue", stroke: "deepskyblue" }),
		"rotatingTool.handleAngle": 270,
		"rotatingTool.handleDistance": 30,
		"rotatingTool.snapAngleMultiple": 15,
		"rotatingTool.snapAngleEpsilon": 15,
		// por defecto, la rueda del ratón permite hacer zoom en lugar de scroll
		// si el usuario pulsa el botón central del ratón permite hacer scroll
		"toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
		"allowDrop": true, // se permite soltar objetos
		"undoManager.isEnabled": true, // CTRL+Z && CTRL+Y
		"animationManager.isEnabled": false,
		"grid.background": "white"
	});
	diagrama.grid.visible = false; // se habilita el grid
	
	// Función para crear un "puerto", indicando que el nodo puede ser enlazado con otros nodos
	function crearPuerto(nombre, spot, salida, entrada) {
		// es un pequeño círculo transparente
		return $(go.Shape, "Circle",
			{
				fill: null,  // no visto por defecto
				stroke: null, // sin borde
				desiredSize: new go.Size(7, 7),
				alignment: spot,  // alinea respecto a la forma
				alignmentFocus: spot,  // dentro de la forma
				portId: nombre, // id - nombre del "puerto"
				fromSpot: spot, toSpot: spot,  // declara donde se pueden declarar enlaces
				fromLinkable: salida, toLinkable: entrada,  // declara si el usuario puede dibujar enlaces hacia/desde él
				cursor: "pointer"  // muestra el cursor para indicar que es un posible punto de enlace
			});
	}
	
	// Función para mostrar/ocultar los "puertos"
	function mostrarPuertos(nodo, mostrar) {
		nodo.ports.each(function(port) {
			if (port.portId !== "") {  // no cambiar el puerto por defecto
				port.fill = mostrar ? "rgba(0,0,0,.3)" : null;
			}
		});
	}
	
	
	/***
		NODOS
	***/
	
	// Plantilla para selección de nodo
	var plantillaSeleccionNodo =
	$(go.Adornment, "Auto",
		$(go.Shape, { fill: null, stroke: "deepskyblue", strokeWidth: 1.5, strokeDashArray: [4, 2] }),
		$(go.Placeholder)
	);
	
	// Plantilla para redimensión de nodo
	var plantillaRedimensionNodo =
	$(go.Adornment, "Spot",
		{ locationSpot: go.Spot.Right },
		$(go.Placeholder),
		$(go.Shape, { alignment: go.Spot.TopLeft, cursor: "nw-resize", desiredSize: new go.Size(4, 4), fill: "lightblue", stroke: "deepskyblue" }),
		$(go.Shape, { alignment: go.Spot.Top, cursor: "n-resize", desiredSize: new go.Size(4, 4), fill: "lightblue", stroke: "deepskyblue" }),
		$(go.Shape, { alignment: go.Spot.TopRight, cursor: "ne-resize", desiredSize: new go.Size(4, 4), fill: "lightblue", stroke: "deepskyblue" }),
		
		$(go.Shape, { alignment: go.Spot.Left, cursor: "w-resize", desiredSize: new go.Size(4, 4), fill: "lightblue", stroke: "deepskyblue" }),
		$(go.Shape, { alignment: go.Spot.Right, cursor: "e-resize", desiredSize: new go.Size(4, 4), fill: "lightblue", stroke: "deepskyblue" }),
		
		$(go.Shape, { alignment: go.Spot.BottomLeft, cursor: "se-resize", desiredSize: new go.Size(4, 4), fill: "lightblue", stroke: "deepskyblue" }),
		$(go.Shape, { alignment: go.Spot.Bottom, cursor: "s-resize", desiredSize: new go.Size(4, 4), fill: "lightblue", stroke: "deepskyblue" }),
		$(go.Shape, { alignment: go.Spot.BottomRight, cursor: "sw-resize", desiredSize: new go.Size(4, 4), fill: "lightblue", stroke: "deepskyblue" })
	);
	
	// Plantilla para rotación de nodo
	var plantillaRotacionNodo =
	$(go.Adornment,
		{ locationSpot: go.Spot.Center, locationObjectName: "ELLIPSE" },
		$(go.Shape, "Ellipse", { name: "ELLIPSE", cursor: "pointer", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
		$(go.Shape, { geometryString: "M3.5 7 L3.5 30", isGeometryPositioned: true, stroke: "deepskyblue", strokeWidth: 1.5, strokeDashArray: [4, 2] })
	);
	
	// Plantilla para definir un nodo de tipo forma + texto
	// En este caso, una forma con un texto
	var plantillaNodoForma =
	$(go.Node, "Spot",
		{ locationSpot: go.Spot.Center },
		new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify), // importante para replicar la información a través del servidor
		{ selectable: true, selectionAdornmentTemplate: plantillaSeleccionNodo },
		{ resizable: true, resizeObjectName: "PANEL", resizeAdornmentTemplate: plantillaRedimensionNodo },
		{ rotatable: true, rotateAdornmentTemplate: plantillaRotacionNodo },
		new go.Binding("angle").makeTwoWay(),
		// el objeto principal es un panel que contiene un texto dentro de una forma
		$(go.Panel, "Auto",
			{ name: "PANEL" },
			new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
			$(go.Shape, "Rectangle",  // figura por defecto
				{
					portId: "", // puerto por defecto: si no hay lugar en los datos del enlace, se usa el lado más cercano
					fromLinkable: true, toLinkable: true, cursor: "pointer",
					fill: "white",  // color por defecto
					strokeWidth: 2,
					stretch: go.GraphObject.Fill
				},
				new go.Binding("figure"),
				new go.Binding("fill"),
				new go.Binding("strokeWidth"),
				new go.Binding("width"),
			new go.Binding("height")),
			$(go.TextBlock, // texto
				{
					font: "bold 8pt Helvetica, Arial, sans-serif",
					margin: 8,
					//maxSize: new go.Size(160, NaN),
					wrap: go.TextBlock.WrapFit,
					editable: true
				},
			new go.Binding("text").makeTwoWay())
		),
		// cuatro pequeños "puertos", uno para cada lado del nodo
		crearPuerto("T", go.Spot.Top, false, true),
		crearPuerto("L", go.Spot.Left, true, true),
		crearPuerto("R", go.Spot.Right, true, true),
		crearPuerto("B", go.Spot.Bottom, true, false),
		{ // se asocia los eventos entrar/salir para mostrar/ocultar dichos "puertos"
			mouseEnter: function(e, nodo) { mostrarPuertos(nodo, true); },
			mouseLeave: function(e, nodo) { mostrarPuertos(nodo, false); }
		}
	);
	
	// Plantilla para definir un nodo de tipo figura + texto
	// En este caso, una figura y debajo un texto
	var plantillaNodoImagen =
	$(go.Node, "Spot",
		{ locationSpot: go.Spot.Center },
		new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify), // importante para replicar la información a través del servidor
		{ selectable: true, selectionAdornmentTemplate: plantillaSeleccionNodo },
		{ resizable: true, resizeObjectName: "FIGURA", resizeAdornmentTemplate: plantillaRedimensionNodo },
		{ rotatable: true, rotateAdornmentTemplate: plantillaRotacionNodo },
		new go.Binding("angle").makeTwoWay(),
		// el objeto principal es un panel que contiene un texto debajo de una figura
		$(go.Panel, "Vertical",
			//new go.Binding("desiredSize", "pictureSize", go.Size.parse).makeTwoWay(go.Size.stringify), // no funciona, revisar!!!!!!!!
			$(go.Picture,
				{
					name: "FIGURA",
					desiredSize: new go.Size(16, 16), // tamaño por defecto
					imageStretch: go.GraphObject.Fill,
					margin: 2,
					
				},
				new go.Binding("source"),
			new go.Binding("desiredSize")),
			/* $(go.TextBlock, // texto
				{
					font: "bold 8pt Helvetica, Arial, sans-serif",
					margin: 2,
					maxSize: new go.Size(160, NaN),
					wrap: go.TextBlock.WrapFit,
					editable: true
				},
			new go.Binding("text").makeTwoWay()) */
		),
		// cuatro pequeños "puertos", uno para cada lado del nodo
		crearPuerto("T", go.Spot.Top, false, true),
		crearPuerto("L", go.Spot.Left, true, true),
		crearPuerto("R", go.Spot.Right, true, true),
		crearPuerto("B", go.Spot.Bottom, true, false),
		{ // se asocia los eventos entrar/salir para mostrar/ocultar dichos "puertos"
			mouseEnter: function(e, nodo) { mostrarPuertos(nodo, true); },
			mouseLeave: function(e, nodo) { mostrarPuertos(nodo, false); }
		}
	);
	
	// Como se hace uso de diferentes plantillas de nodos es necesario guardarlas y asociarlas al diagrama
	var plantillasNodos = new go.Map();
	plantillasNodos.add("forma", plantillaNodoForma);
	plantillasNodos.add("imagen", plantillaNodoImagen);
	diagrama.nodeTemplateMap = plantillasNodos;
	
	
	/***
		LINKS
	***/
	// Plantilla seleccion enlace
	var plantillaSeleccionEnlace =
	$(go.Adornment, "Link",
		$(go.Shape,
			// isPanelMain declara si la forma comparte la geometría (Link.geometry)
		{ isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 })
	);
	
	// Plantilla de enlace con doble flecha
	var plantillaEnlace =
	$(go.Link,
		new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
		{ selectable: true, selectionAdornmentTemplate: plantillaSeleccionEnlace },
		{ relinkableFrom: true, relinkableTo: true, reshapable: true },
		{
			routing: go.Link.Orthogonal,
			curve: go.Link.JumpOver,
			corner: 5,
			toShortLength: 4
		},
		new go.Binding("points").makeTwoWay(),
		$(go.Shape, // la forma de la línea
			{ isPanelMain: true },
			new go.Binding("stroke", "linkStrokeColor"),
		new go.Binding("strokeWidth", "linkStrokeWidth")),
		$(go.Shape,  // la forma de la flecha origen
			new go.Binding("fromArrow", "fromArrowShape"),
			new go.Binding("stroke", "fromArrowStrokeColor"),
			new go.Binding("fill", "fromArrowColor"),
		new go.Binding("strokeWidth", "fromArrowStrokeWidth")),
		$(go.Shape,  // la forma de la flecha destino
			new go.Binding("toArrow", "toArrowShape"),
			new go.Binding("stroke", "toArrowStrokeColor"),
			new go.Binding("fill", "toArrowColor"),
		new go.Binding("strokeWidth", "toArrowStrokeWidth")),
		$(go.Panel, "Auto",
			//new go.Binding("visible", "isSelected").ofObject(),
			$(go.Shape, "RoundedRectangle",  // la forma del texto del enlace
			{ fill: "transparent", stroke: null }),
			$(go.TextBlock, // texto del enlace, editable
				{
					textAlign: "center",
					font: "8pt helvetica, arial, sans-serif",
					stroke: "#919191",
					margin: 4,
					minSize: new go.Size(10, NaN),
					editable: true
				},
			new go.Binding("text").makeTwoWay())
		)
	);
	
	// Como se hace uso de diferentes plantillas de enlaces es necesario guardarlas y asociarlas al diagrama
	var plantillasEnlaces = new go.Map();
	// plantillasEnlaces.add("unaFlecha", plantillaEnlaceUnaFlecha);
	plantillasEnlaces.add("enlace", plantillaEnlace);
	diagrama.linkTemplateMap = plantillasEnlaces;
	
	// El modelo del diagrama se encuentra vacío inicialmente
	diagrama.model = $(go.GraphLinksModel,
		{
			linkKeyProperty: "key", // importante para poder compartir la información en un GraphLinksModel
			nodeDataArray: [],
			linkDataArray: []
		});
		
		
		
		/***
			COMUNICACIÓN CLIENTE-SERVIDOR
			--- TOGETHERJS ---
		***/
		/* diagrama.model.addChangedListener(function(e) {
			if (e.isTransactionFinished) {
				var json = e.model.toIncrementalJson(e);
				
				if (TogetherJS.running) {
					TogetherJS.send({
						type: "content-send",
						output: json
					});
					console.log(json)
				}
			}
		});
		
		TogetherJS.hub.on("content-send", function(msg) {
			if (!msg.sameUrl) {
				return;
			}
			diagrama.model.applyIncrementalJson(msg.output);
			//diagram.isModified = false;
			console.log(msg.output);
		}); */
		
		
		// Crear la paleta
		var palette =
		$(go.Palette, "divPaleta",
			{
				maxSelectionCount: 1,
				nodeTemplateMap: diagrama.nodeTemplateMap,  // se asocian las plantillas de los nodos
				linkTemplateMap: diagrama.linkTemplateMap,	// se asocian las plantillas de los enlaces
				model: new go.GraphLinksModel([  // contenidos de la paleta
					// nodos
					/*{ text: "Entity", figure: "Rectangle", fill: "lightskyblue", category: "forma" },*/
					// { text: "Picture", source: "file:///C:/Users/YoelA/OneDrive/Escritorio/Pictos_QueHacemosHoy/Bañarse.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Bañarse.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Beber.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Cantar.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Casa.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Colegio.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Comer.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Comprar.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Dibujar.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Dormir.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Encajable.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Escribir.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/EscucharMusica.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Hablar.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Hospital.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/IrBaño.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Jugar.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/LavarCara.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/LavarDientes.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/LavarManos.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Leer.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Natacion.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Ordenar.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Parque.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Pasear.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/PegarGomets.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Peinarse.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Pintar.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Recoger.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Saludar.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Sentarse.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/VerTv.png", desiredSize: new go.Size(128, 128), category: "imagen" },
					{ text: "Picture", source: "images/Vestirse.png", desiredSize: new go.Size(128, 128), category: "imagen" },
				], [ /* enlaces */ ])
				});				