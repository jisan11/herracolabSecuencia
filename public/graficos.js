function init() {
    const $ = go.GraphObject.make;
    myDiagram = $(go.Diagram, "myDiagramDiv",
        {
            //cuadriculas en la pizarra
            grid: $(go.Panel, "Grid",
                $(go.Shape, "LineH", { stroke: "lightgray", strokeWidth: 0.5 }),
                $(go.Shape, "LineH", { stroke: "gray", strokeWidth: 0.5, interval: 5 }),
                $(go.Shape, "LineV", { stroke: "lightgray", strokeWidth: 0.5 }),
                $(go.Shape, "LineV", { stroke: "gray", strokeWidth: 0.5, interval: 5 })
            ),
            "LinkDrawn": showLinkLabel,  // este oyente DiagramEvent se define a continuación
            "LinkRelinked": showLinkLabel,
            "undoManager.isEnabled": true,
            "animationManager.initialAnimationStyle": go.AnimationManager.None,
            //"InitialAnimationStarting": animateFadeDown,
            // habilitar deshacer y rehacer
            "draggingTool.dragsLink": true,
            "draggingTool.isGridSnapEnabled": true,
            "linkingTool.isUnconnectedLinkValid": true,
            "linkingTool.portGravity": 20,
            "relinkingTool.isUnconnectedLinkValid": true,
            "relinkingTool.portGravity": 20,
            allowCopy: true,
            linkingTool: $(MessagingTool),  // defined below
            "resizingTool.isGridSnapEnabled": true,
            draggingTool: $(MessageDraggingTool),  // defined below
            "draggingTool.gridSnapCellSize": new go.Size(1, MessageSpacing / 4),
            "draggingTool.isGridSnapEnabled": true,
            // automatically extend Lifelines as Activities are moved or resized
            "SelectionMoved": ensureLifelineHeights,
            "PartResized": ensureLifelineHeights,
            "commandHandler.archetypeGroupData": { isGroup: true, text: "Group", horiz: false },
            "LinkDrawn": showLinkLabel,  // este oyente DiagramEvent se define a continuación
            "LinkRelinked": showLinkLabel,
            "undoManager.isEnabled": true,
            mouseDrop: function (e, node) {
                save();
            }
        }
    );

    // when the document is modified, add a "*" to the title and enable the "Save" button
    myDiagram.addDiagramListener("Modified", e => {
        const button = document.getElementById("SaveButton");
        if (button) button.disabled = !myDiagram.isModified;
        const idx = document.title.indexOf("*");
        if (myDiagram.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.slice(0, idx);
        }
    });


    //Se define el nodo o componente Linea de Vida
    myDiagram.nodeTemplateMap.add("LineaDeVida",
        $(go.Node, "Vertical",
            {
                locationSpot: go.Spot.Top,
                resizable: true,
                //minSize: new go.Size(90, 30),
                resizeObjectName: 'segmento',
                //resizeObjectName: 'HEADER',
                locationSpot: go.Spot.Bottom,
                locationObjectName: 'HEADER',
                minLocation: new go.Point(0, 0),
                maxLocation: new go.Point(9999, 0),
                selectionObjectName: 'HEADER',
                resizeAdornmentTemplate:
                    $(go.Adornment, 'Spot',
                        $(go.Placeholder),
                        $(go.Shape,  // only a bottom resize handle
                            {
                                alignment: go.Spot.Bottom,
                                cursor: 'col-resize',
                                desiredSize: new go.Size(6, 6),
                                fill: 'yellow'
                            })
                    ),
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            $(go.Panel, "Auto",
                { name: "HEADER" },
                $(go.Shape, "rectangle",
                    {
                        fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                        stroke: "null"
                    }),
                $(go.TextBlock,
                    {
                        margin: 5,
                        font: "400 10pt Source Sans Pro, sans-serif",
                        isMultiline: false, editable: true,
                    },
                    new go.Binding("text", "text").makeTwoWay()
                ),
            ),
            $(go.Shape,
                {
                    name: "segmento",
                    figure: "LineV",
                    fill: null,
                    stroke: "gray",
                    strokeDashArray: [3, 3],
                    width: 1,
                    alignment: go.Spot.Center,
                    portId: "",
                    fromLinkable: true,
                    fromLinkableDuplicates: true,
                    toLinkable: true,
                    toLinkableDuplicates: true,
                    cursor: "pointer"
                },
                new go.Binding("height", "duration", computeLifelineHeight))
        )

    );


    // define the Activity Node template
    myDiagram.nodeTemplate = $(go.Node,
        {
            locationSpot: go.Spot.Top,
            locationObjectName: 'SHAPE',
            minLocation: new go.Point(NaN, LinePrefix - ActivityStart),
            maxLocation: new go.Point(NaN, 19999),
            selectionObjectName: 'SHAPE',
            resizable: true,
            resizeObjectName: 'SHAPE',
            resizeAdornmentTemplate:
                $(go.Adornment, 'Spot',
                    $(go.Placeholder),
                    $(go.Shape,  // only a bottom resize handle
                        {
                            alignment: go.Spot.Bottom,
                            cursor: 'col-resize',
                            desiredSize: new go.Size(6, 6),
                            fill: 'yellow'
                        })
                )
        },
        new go.Binding('location', '', computeActivityLocation).makeTwoWay(backComputeActivityLocation),
        $(go.Shape, 'Rectangle',
            {
                name: 'SHAPE',
                fill: 'white',
                stroke: 'black',
                width: ActivityWidth,
                // allow Activities to be resized down to 1/4 of a time unit
                minSize: new go.Size(ActivityWidth, computeActivityHeight(0.25))
            },
            new go.Binding("height", "duration", computeActivityHeight).makeTwoWay(backComputeActivityHeight))
    );

    // define the Message Link template.
    myDiagram.linkTemplate = $(MessageLink,  // defined below
        { selectionAdorned: true, curviness: 0 },
        $(go.Shape, 'Rectangle',
            { stroke: 'black' }),
        $(go.Shape,
            { toArrow: 'OpenTriangle', stroke: 'black' }),
        $(go.TextBlock,
            {
                font: '400 9pt Source Sans Pro, sans-serif',
                segmentIndex: 0,
                segmentOffset: new go.Point(NaN, NaN),
                isMultiline: false,
                editable: true
            },
            new go.Binding('text', 'text').makeTwoWay()
        )
    );

    //Se define el nodo o componente Actor
    myDiagram.nodeTemplateMap.add("actor",
        $(go.Node, "Vertical",
            {
                locationSpot: go.Spot.Top,
                resizable: true,
                resizeObjectName: 'segmento',
                locationSpot: go.Spot.Bottom,
                locationObjectName: "HEADER",
                minLocation: new go.Point(0, 0),
                maxLocation: new go.Point(9999, 0),
                selectionObjectName: "HEADER",
                resizeAdornmentTemplate:
                    $(go.Adornment, 'Spot',
                        $(go.Placeholder),
                        $(go.Shape,  // only a bottom resize handle
                            {
                                alignment: go.Spot.Bottom,
                                cursor: 'col-resize',
                                desiredSize: new go.Size(6, 6),
                                fill: 'yellow'
                            })
                    ),
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            $(go.Panel, "Auto",
                { name: "HEADER" },
                $(go.Shape, "Actor",
                    {
                        width: 17,
                        height: 50,
                        strokeWidth: 0.01,
                    }
                ),

            ),
            $(go.TextBlock,
                {
                    //textAlign: "center",
                    margin: 5,
                    font: "400 10pt Source Sans Pro, sans-serif",
                    isMultiline: false,
                    editable: true,
                },
                new go.Binding("text", "text").makeTwoWay()
            ),
            $(go.Shape,
                {
                    name: "segmento",
                    figure: "LineV",
                    fill: null,
                    stroke: "gray",
                    strokeDashArray: [3, 3],
                    width: 1,
                    alignment: go.Spot.Center,
                    portId: "",
                    fromLinkable: true,
                    fromLinkableDuplicates: true,
                    toLinkable: true,
                    toLinkableDuplicates: true,
                    cursor: "pointer"
                },
                new go.Binding("height", "duration", computeLifelineHeight))
        )

    );

    //Se define el nodo o componente Límite
    myDiagram.nodeTemplateMap.add("limite",
        $(go.Node, "Vertical",
            {
                locationSpot: go.Spot.Top,
                resizable: true,
                resizeObjectName: 'segmento',
                locationSpot: go.Spot.Bottom,
                locationObjectName: "HEADER",
                minLocation: new go.Point(0, 0),
                maxLocation: new go.Point(9999, 0),
                selectionObjectName: "HEADER",
                resizeAdornmentTemplate:
                    $(go.Adornment, 'Spot',
                        $(go.Placeholder),
                        $(go.Shape,  // only a bottom resize handle
                            {
                                alignment: go.Spot.Bottom,
                                cursor: 'col-resize',
                                desiredSize: new go.Size(6, 6),
                                fill: 'yellow'
                            })
                    ),
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            $(go.Panel, "Horizontal",
                { name: "HEADER" },
                $(go.Shape, "LineV",
                    {
                        width: 2,
                        height: 50,
                        strokeWidth: 2,
                        stroke: "black"
                    }),
                $(go.Shape, "Circle",
                    {
                        width: 42,
                        height: 42,
                        strokeWidth: 2,
                        //fill: "lightgreen",
                        fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                        stroke: "black"
                    })
            ),
            $(go.TextBlock, "limite",
                {
                    //textAlign: "center",
                    margin: 5,
                    font: "bold 12px sans-serif",
                    isMultiline: false,
                    editable: true,
                },
                new go.Binding("text", "text").makeTwoWay()
            ),
            $(go.Shape,
                {
                    name: "segmento",
                    figure: "LineV",
                    fill: null,
                    stroke: "gray",
                    strokeDashArray: [3, 3],
                    width: 1,
                    alignment: go.Spot.Center,
                    portId: "",
                    fromLinkable: true,
                    fromLinkableDuplicates: true,
                    toLinkable: true,
                    toLinkableDuplicates: true,
                    cursor: "pointer"
                },
                new go.Binding("height", "duration", computeLifelineHeight))
        ),


    );

    //Se define el nodo o componente Control
    myDiagram.nodeTemplateMap.add("control",
        $(go.Node, "Vertical",
            {
                locationSpot: go.Spot.Top,
                resizable: true,
                resizeObjectName: 'segmento',
                locationSpot: go.Spot.Bottom,
                locationObjectName: "HEADER",
                minLocation: new go.Point(0, 0),
                maxLocation: new go.Point(9999, 0),
                selectionObjectName: "HEADER",
                resizeAdornmentTemplate:
                    $(go.Adornment, 'Spot',
                        $(go.Placeholder),
                        $(go.Shape,  // only a bottom resize handle
                            {
                                alignment: go.Spot.Bottom,
                                cursor: 'col-resize',
                                desiredSize: new go.Size(6, 6),
                                fill: 'yellow'
                            })
                    ),
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            $(go.Panel, "Spot",
                { name: "HEADER" },
                $(go.Shape, "Circle",
                    {
                        width: 42,
                        height: 42,
                        strokeWidth: 2,
                        //fill: "lightgreen",
                        //stroke: "green"
                        fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                        stroke: "black"
                    }),
                $(go.Shape, "TriangleRight",
                    {
                        width: 10,
                        height: 10,
                        strokeWidth: 2,
                        //fill: "lightgreen",
                        //stroke: "green"
                        fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                        stroke: "black"
                    },
                    {
                        alignment: go.Spot.Top,
                        alignmentFocus: go.Spot.Left
                    })
            ),
            $(go.TextBlock, "Control",
                {
                    //textAlign: "center",
                    margin: 5,
                    font: "bold 12px sans-serif",
                    isMultiline: false, editable: true,
                },
                new go.Binding("text", "text").makeTwoWay()
            ),
            $(go.Shape,
                {
                    name: "segmento",
                    figure: "LineV",
                    fill: null,
                    stroke: "gray",
                    strokeDashArray: [3, 3],
                    width: 1,
                    alignment: go.Spot.Center,
                    portId: "",
                    fromLinkable: true,
                    fromLinkableDuplicates: true,
                    toLinkable: true,
                    toLinkableDuplicates: true,
                    cursor: "pointer"
                },
                new go.Binding("height", "duration", computeLifelineHeight))
        ),
    );

    //Se define el nodo o componente Entidad
    myDiagram.nodeTemplateMap.add("entidad",
        $(go.Node, "Vertical",
            {
                locationSpot: go.Spot.Top,
                resizable: true,
                resizeObjectName: 'segmento',
                locationSpot: go.Spot.Bottom,
                locationObjectName: "HEADER",
                minLocation: new go.Point(0, 0),
                maxLocation: new go.Point(9999, 0),
                selectionObjectName: "HEADER",
                resizeAdornmentTemplate:
                    $(go.Adornment, 'Spot',
                        $(go.Placeholder),
                        $(go.Shape,  // only a bottom resize handle
                            {
                                alignment: go.Spot.Bottom,
                                cursor: 'col-resize',
                                desiredSize: new go.Size(6, 6),
                                fill: 'yellow'
                            })
                    ),
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            $(go.Panel, "Vertical",
                { name: "HEADER" },
                $(go.Shape, "Circle",
                    {
                        width: 42,
                        height: 42,
                        strokeWidth: 2,
                        //fill: "lightgreen", stroke: "green"
                        fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                        stroke: "black"
                    }),
                $(go.Shape, "LineH",
                    {
                        width: 50,
                        height: 2,
                        strokeWidth: 2,
                        stroke: "black"
                    }),
            ),
            $(go.TextBlock, "Entidad",
                {
                    //textAlign: "center",
                    margin: 5,
                        font: "bold 12px sans-serif",
                    isMultiline: false, 
                    editable: true,
                },
                new go.Binding("text", "text").makeTwoWay()
            ),
            $(go.Shape,
                {
                    name: "segmento",
                    figure: "LineV",
                    fill: null,
                    stroke: "gray",
                    strokeDashArray: [3, 3],
                    width: 1,
                    alignment: go.Spot.Center,
                    portId: "",
                    fromLinkable: true,
                    fromLinkableDuplicates: true,
                    toLinkable: true,
                    toLinkableDuplicates: true,
                    cursor: "pointer"
                },
                new go.Binding("height", "duration", computeLifelineHeight))
        )
    );

    //Se define el nodo o componente Fragmento
    myDiagram.nodeTemplateMap.add("fragmento",
        $(go.Node, "Auto",
            $(go.Shape, "Rectangle",
                {
                    width: 120,
                    height: 60,
                    strokeWidth: 2,
                    fill: "lightyellow",
                    stroke: "orange"
                }),
            $(go.Shape, "Rectangle",
                {
                    width: 20,
                    height: 20,
                    strokeWidth: 2,
                    fill: "white",
                    stroke: "orange",
                    alignment: go.Spot.TopLeft,
                    margin: 5,
                },
                new go.Binding("text", "text")),
            $(go.TextBlock, "Fragmento",
                {
                    textAlign: "center",
                    font: "bold 12px sans-serif",
                    isMultiline: false, editable: true,
                })
        )
    );


    // myDiagram.nodeTemplateMap.add("prueba2",
    //     $(go.Node, "Vertical",
    //         {
    //             locationSpot: go.Spot.Bottom,
    //             locationObjectName: "HEADER",
    //             minLocation: new go.Point(0, 0),
    //             maxLocation: new go.Point(9999, 0),
    //             selectionObjectName: "HEADER"
    //         },
    //         new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    //         $(go.Panel, "Auto",
    //             { name: "HEADER" },
    //             $(go.Shape, "circle",
    //                 {
    //                     width: 42, height: 42,
    //                     fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
    //                     stroke: null
    //                 }),
    //             $(go.TextBlock,
    //                 {
    //                     margin: 0,
    //                     font: "400 10pt Source Sans Pro, sans-serif",
    //                     isMultiline: false, editable: true,
    //                 },
    //                 new go.Binding("text", "text").makeTwoWay()
    //             ),
    //         ),
    //         $(go.Shape,
    //             {
    //                 figure: "LineV",
    //                 fill: null,
    //                 stroke: "gray",
    //                 strokeDashArray: [3, 3],
    //                 width: 1,
    //                 alignment: go.Spot.Center,
    //                 portId: "",
    //                 fromLinkable: true,
    //                 fromLinkableDuplicates: true,
    //                 toLinkable: true,
    //                 toLinkableDuplicates: true,
    //                 cursor: "pointer"
    //             },
    //             new go.Binding("height", "duration", computeLifelineHeight))
    //     )

    // );

    // myDiagram.nodeTemplateMap.add("mensaje",
    //     $(go.Node,
    //         {
    //             locationSpot: go.Spot.Top,
    //             locationObjectName: "SHAPE",
    //             //minLocation: new go.Point(NaN, LinePrefix - ActivityStart),
    //             //maxLocation: new go.Point(NaN, 19999),
    //             selectionObjectName: "SHAPE",
    //             resizable: true,
    //             resizeObjectName: "SHAPE",
    //             resizeAdornmentTemplate:
    //                 $(go.Adornment, "Spot",
    //                     $(go.Placeholder),
    //                     $(go.Shape,  // only a bottom resize handle
    //                         {
    //                             alignment: go.Spot.Bottom, cursor: "col-resize",
    //                             desiredSize: new go.Size(6, 6), fill: "yellow"
    //                         })
    //                 )
    //         },
    //         new go.Binding("location", "", computeActivityLocation).makeTwoWay(backComputeActivityLocation),
    //         $(go.Shape, "Rectangle",
    //             {
    //                 name: "SHAPE",
    //                 fill: "white", stroke: "black",
    //                 width: ActivityWidth,
    //                 // allow Activities to be resized down to 1/4 of a time unit
    //                 minSize: new go.Size(ActivityWidth, computeActivityHeight(0.25))
    //             },
    //             new go.Binding("height", "duration", computeActivityHeight).makeTwoWay(backComputeActivityHeight))
    //     )
    // );


    ///////////////////////////////////////////////////////////
    // create the graph by reading the JSON data saved in "mySavedModel" textarea element
    // load();    
    ///////////////////////////////////////////////////////////////

    // myPalette =
    //     new go.Palette("myPaletteDiv",
    //         {
    //             nodeTemplateMap: myDiagram.nodeTemplateMap,
    //             groupTemplateMap: myDiagram.groupTemplateMap
    //         }
    //     );

    var myPalette =
        new go.Palette("myPaletteDiv");

    myPalette.nodeTemplateMap.add("LineaDeVida",
        $(go.Node, "Horizontal",
            $(go.Panel, "Vertical",
                $(go.Panel, "Auto",
                    { name: "HEADER" },
                    $(go.Shape, "rectangle",
                        {
                            width: 15,
                            height: 10,
                            fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                            stroke: "black"
                        }),
                ),
                $(go.Shape,
                    {
                        figure: "LineV",
                        fill: null,
                        stroke: "black",
                        strokeDashArray: [3, 3],
                        width: 1,
                        height: 10,
                    },
                    new go.Binding("duration", computeLifelineHeight)),

            ),

            $(go.TextBlock,
                {
                    margin: 15,
                    font: "400 10pt Source Sans Pro, sans-serif",
                    //isMultiline: false, editable: true,
                },
                new go.Binding("text", "text").makeTwoWay()
            ),
        ),
    );





    //Se define el nodo o componente Actor
    myPalette.nodeTemplateMap.add("actor",
        $(go.Node, "Horizontal",
            $(go.Panel, "Vertical",
                $(go.Panel, "Auto",
                    { name: "HEADER" },
                    $(go.Shape, "Actor",
                        {
                            width: 10,
                            height: 30,
                            strokeWidth: 0.01,
                        }
                    ),
                    // $(go.TextBlock, "Actor Name",
                    //     {
                    //         //textAlign: "center",
                    //         margin: 5,
                    //         font: "400 10pt Source Sans Pro, sans-serif",
                    //         isMultiline: false,
                    //         editable: true,
                    //     },
                    // ),
                ),
                // $(go.Shape,
                //     {
                //         figure: "LineV",
                //         fill: null,
                //         stroke: "gray",
                //         strokeDashArray: [3, 3],
                //         width: 1,
                //         height: 10,
                //     },
                //     new go.Binding("duration", computeLifelineHeight))
            ),
            $(go.TextBlock,
                {
                    margin: 15,
                    font: "400 10pt Source Sans Pro, sans-serif",
                    //isMultiline: false, editable: true,
                },
                new go.Binding("text", "text").makeTwoWay()
            ),
        ),
    );

    myPalette.nodeTemplateMap.add("limite",
        $(go.Node, "Horizontal",
            $(go.Panel, "Vertical",
                $(go.Panel, "Horizontal", { name: "HEADER" },
                    $(go.Shape, "LineV",
                        {
                            width: 2,
                            height: 15,
                            strokeWidth: 1,
                            stroke: "black"
                        }),
                    $(go.Shape, "Circle",
                        {
                            width: 16,
                            height: 16,
                            strokeWidth: 1,
                            //fill: "lightgreen",
                            fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                            stroke: "black"
                        }),
                ),
                $(go.Shape,
                    {
                        figure: "LineV",
                        fill: null,
                        stroke: "black",
                        strokeDashArray: [3, 3],
                        width: 1,
                        height: 10,
                    },
                    new go.Binding("duration", computeLifelineHeight))
            ),
            $(go.TextBlock, "limite",
                {
                    //textAlign: "center",
                    margin: 15,
                    font: "400 10pt Source Sans Pro, sans-serif",
                },
                new go.Binding("text", "text").makeTwoWay()
            ),

        ),

    );

    myPalette.nodeTemplateMap.add("control",
        $(go.Node, "Horizontal",
            $(go.Panel, "Vertical",
                $(go.Panel, "Spot",
                    { name: "HEADER" },
                    $(go.Shape, "Circle",
                        {
                            width: 16,
                            height: 16,
                            strokeWidth: 1,
                            //fill: "lightgreen",
                            //stroke: "green"
                            fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                            stroke: "black"
                        }),
                    $(go.Shape, "TriangleRight",
                        {
                            width: 5,
                            height: 5,
                            strokeWidth: 1,
                            //fill: "lightgreen",
                            //stroke: "green"
                            fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                            stroke: "black"
                        },
                        {
                            alignment: go.Spot.Top,
                            alignmentFocus: go.Spot.Left
                        })
                ),
                $(go.Shape,
                    {
                        figure: "LineV",
                        fill: null,
                        stroke: "black",
                        strokeDashArray: [3, 3],
                        width: 1,
                        height: 10
                    },
                    new go.Binding("duration", computeLifelineHeight)
                ),
            ),

            $(go.TextBlock, "Control",
                {
                    //textAlign: "center",
                    margin: 15,
                    font: "400 10pt Source Sans Pro, sans-serif",
                },
                new go.Binding("text", "text").makeTwoWay()
            ),
        ),

    );

    myPalette.nodeTemplateMap.add("entidad",
        $(go.Node, "Horizontal",
            $(go.Panel, "Vertical",
                $(go.Panel, "Vertical",
                    { name: "HEADER" },
                    $(go.Shape, "Circle",
                        {
                            width: 17,
                            height: 17,
                            strokeWidth: 1,
                            //fill: "lightgreen", stroke: "green"
                            fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                            stroke: "black"
                        }),
                    $(go.Shape, "LineH",
                        {
                            width: 19,
                            height: 2,
                            strokeWidth: 1,
                            stroke: "black"
                        }),

                ),
                $(go.Shape,
                    {
                        figure: "LineV",
                        fill: null,
                        stroke: "black",
                        strokeDashArray: [3, 3],
                        width: 1,
                        height: 10,
                    },
                    new go.Binding("duration", computeLifelineHeight),
                ),
            ),

            $(go.TextBlock, "Entidad",
                {
                    //textAlign: "center",
                    margin: 15,
                    font: "400 10pt Source Sans Pro, sans-serif",
                },
                new go.Binding("text", "text").makeTwoWay(),
            ),
        )
    );


    //Agregar el template de los componentes a la paleta
    // Agrega el template del componente "LineaDeVida" a la paleta
    // myPalette.nodeTemplateMap.add("LineaDeVida", myDiagram.groupTemplateMap.get("LineaDeVida"));
    // myPalette.nodeTemplateMap.add("actor", myDiagram.groupTemplateMap.get("actor"));
    // myPalette.nodeTemplateMap.add("limite", myDiagram.groupTemplateMap.get("limite"));
    // myPalette.nodeTemplateMap.add("control", myDiagram.groupTemplateMap.get("control"));
    // myPalette.nodeTemplateMap.add("entidad", myDiagram.groupTemplateMap.get("entidad"));

    // myPalette.model = new go.GraphLinksModel([
    //     { category: "actor_", key: "Group1", text: "actor", loc: "0 0", duration: 9 },
    //     { category: "Linea_De_Vida", key: "Group2", text: "Línea de vida", loc: "20 0", duration: 9 },
    //     { category: "limite", key: "Group3", text: "Límite", loc: "30 0", duration: 9 },
    //     { category: "control", key: "Group4", text: "Control", loc: "40 0", duration: 9 },
    //     { category: "entidad", key: "Group5", text: "Entidad", loc: "50 0", duration: 9 },
    //     // { category: "fragmento", key: "Group7", text: "if" },
    //     //{ category: "mensaje", text: "Otro Node", color: "#ACE600" },
    //     //{ category: "paralelo", text: "New Node", color: "#ACE600" },
    //     //{ category: "prueba2", key: "Group2", text: "Línea de vida", loc: "10 0", duration: 9 },
    // ]);


    myPalette.model.nodeDataArray = [
        { category: "actor", key: "Group1", text: "actor", loc: "0 0", duration: 9 },
        { category: "LineaDeVida", key: "Group2", text: "Línea de vida", loc: "20 0", duration: 9 },
        { category: "limite", key: "Group3", text: "Límite", loc: "30 0", duration: 9 },
        { category: "control", key: "Group4", text: "Control", loc: "40 0", duration: 9 },
        { category: "entidad", key: "Group5", text: "Entidad", loc: "50 0", duration: 9 },
    ];



    // Hacer visibles las etiquetas de los enlaces si salen de un nodo "condicional".
    // Este oyente es llamado por los DiagramEvents "LinkDrawn" y "LinkRelinked".
    function showLinkLabel(e) {
        var label = e.subject.findObject("LABEL");
        if (label !== null) label.visible = (e.subject.fromNode.data.category === "tabla");
    }

    // los enlaces temporales utilizados por LinkingTool y RelinkingTool también son ortogonales:
    myDiagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
    myDiagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;

    /*if (window.Inspector) myInspector = new Inspector("myInspector", myDiagram,
    {
        properties: {
            "key": { readOnly: true },
            "comments": {}
        }
    });*/

    document.getElementById("blobButton").addEventListener("click", makeBlob);

}

function ensureLifelineHeights(e) {
    // iterate over all Activities (ignore Groups)
    const arr = myDiagram.model.nodeDataArray;
    let max = -1;
    for (let i = 0; i < arr.length; i++) {
        const act = arr[i];
        if (act.isGroup) continue;
        max = Math.max(max, act.start + act.duration);
    }
    if (max > 0) {
        // now iterate over only Groups
        for (let i = 0; i < arr.length; i++) {
            const gr = arr[i];
            if (!gr.isGroup) continue;
            if (max > gr.duration) {  // this only extends, never shrinks
                myDiagram.model.setDataProperty(gr, "duration", max);
            }
        }
    }
}

// some parameters
const LinePrefix = 20;  // vertical starting point in document for all Messages and Activations
const LineSuffix = 30;  // vertical length beyond the last message time
const MessageSpacing = 20;  // vertical distance between Messages at different steps
const ActivityWidth = 10;  // width of each vertical activity bar
const ActivityStart = 5;  // height before start message time
const ActivityEnd = 5;  // height beyond end message time

function computeLifelineHeight(duration) {
    return LinePrefix + duration * MessageSpacing + LineSuffix;
}

function computeActivityLocation(act) {
    const groupdata = myDiagram.model.findNodeDataForKey(act.group);
    if (groupdata === null) return new go.Point();
    // get location of Lifeline's starting point
    const grouploc = go.Point.parse(groupdata.loc);
    return new go.Point(grouploc.x, convertTimeToY(act.start) - ActivityStart);
}
function backComputeActivityLocation(loc, act) {
    myDiagram.model.setDataProperty(act, "start", convertYToTime(loc.y + ActivityStart));
}

function computeActivityHeight(duration) {
    return ActivityStart + duration * MessageSpacing + ActivityEnd;
}
function backComputeActivityHeight(height) {
    return (height - ActivityStart - ActivityEnd) / MessageSpacing;
}

// time is just an abstract small non-negative integer
// here we map between an abstract time and a vertical position
function convertTimeToY(t) {
    return t * MessageSpacing + LinePrefix;
}
function convertYToTime(y) {
    return (y - LinePrefix) / MessageSpacing;
}


// a custom routed Link
class MessageLink extends go.Link {
    constructor() {
        super();
        this.time = 0;  // use this "time" value when this is the temporaryLink
    }

    getLinkPoint(node, port, spot, from, ortho, othernode, otherport) {
        const p = port.getDocumentPoint(go.Spot.Center);
        const r = port.getDocumentBounds();
        const op = otherport.getDocumentPoint(go.Spot.Center);

        const data = this.data;
        const time = data !== null ? data.time : this.time;  // if not bound, assume this has its own "time" property

        const aw = this.findActivityWidth(node, time);
        const x = (op.x > p.x ? p.x + aw / 2 : p.x - aw / 2);
        const y = convertTimeToY(time);
        return new go.Point(x, y);
    }

    findActivityWidth(node, time) {
        let aw = ActivityWidth;
        if (node instanceof go.Group) {
            // see if there is an Activity Node at this point -- if not, connect the link directly with the Group's lifeline
            if (!node.memberParts.any(mem => {
                const act = mem.data;
                return (act !== null && act.start <= time && time <= act.start + act.duration);
            })) {
                aw = 0;
            }
        }
        return aw;
    }

    getLinkDirection(node, port, linkpoint, spot, from, ortho, othernode, otherport) {
        const p = port.getDocumentPoint(go.Spot.Center);
        const op = otherport.getDocumentPoint(go.Spot.Center);
        const right = op.x > p.x;
        return right ? 0 : 180;
    }

    computePoints() {
        if (this.fromNode === this.toNode) {  // also handle a reflexive link as a simple orthogonal loop
            const data = this.data;
            const time = data !== null ? data.time : this.time;  // if not bound, assume this has its own "time" property
            const p = this.fromNode.port.getDocumentPoint(go.Spot.Center);
            const aw = this.findActivityWidth(this.fromNode, time);

            const x = p.x + aw / 2;
            const y = convertTimeToY(time);
            this.clearPoints();
            this.addPoint(new go.Point(x, y));
            this.addPoint(new go.Point(x + 50, y));
            this.addPoint(new go.Point(x + 50, y + 5));
            this.addPoint(new go.Point(x, y + 5));
            return true;
        } else {
            return super.computePoints();
        }
    }
}
// end MessageLink


// A custom LinkingTool that fixes the "time" (i.e. the Y coordinate)
// for both the temporaryLink and the actual newly created Link
class MessagingTool extends go.LinkingTool {
    constructor() {
        super();

        // Since 2.2 you can also author concise templates with method chaining instead of GraphObject.make
        // For details, see https://gojs.net/latest/intro/buildingObjects.html
        const $ = go.GraphObject.make;
        this.temporaryLink =
            $(MessageLink,
                $(go.Shape, "Rectangle",
                    { stroke: "magenta", strokeWidth: 2 }),
                $(go.Shape,
                    { toArrow: "OpenTriangle", stroke: "magenta" }));
    }

    doActivate() {
        super.doActivate();
        const time = convertYToTime(this.diagram.firstInput.documentPoint.y);
        this.temporaryLink.time = Math.ceil(time);  // round up to an integer value
    }

    insertLink(fromnode, fromport, tonode, toport) {
        const newlink = super.insertLink(fromnode, fromport, tonode, toport);
        if (newlink !== null) {
            const model = this.diagram.model;
            // specify the time of the message
            const start = this.temporaryLink.time;
            const duration = 1;
            newlink.data.time = start;
            model.setDataProperty(newlink.data, "text", "msg");
            // and create a new Activity node data in the "to" group data
            const newact = {
                group: newlink.data.to,
                start: start,
                duration: duration
            };
            model.addNodeData(newact);
            // now make sure all Lifelines are long enough
            ensureLifelineHeights();
        }
        return newlink;
    }
}
// end MessagingTool


// A custom DraggingTool that supports dragging any number of MessageLinks up and down --
// changing their data.time value.
class MessageDraggingTool extends go.DraggingTool {
    // override the standard behavior to include all selected Links,
    // even if not connected with any selected Nodes
    computeEffectiveCollection(parts, options) {
        const result = super.computeEffectiveCollection(parts, options);
        // add a dummy Node so that the user can select only Links and move them all
        result.add(new go.Node(), new go.DraggingInfo(new go.Point()));
        // normally this method removes any links not connected to selected nodes;
        // we have to add them back so that they are included in the "parts" argument to moveParts
        parts.each(part => {
            if (part instanceof go.Link) {
                result.add(part, new go.DraggingInfo(part.getPoint(0).copy()));
            }
        })
        return result;
    }

    // override to allow dragging when the selection only includes Links
    mayMove() {
        return !this.diagram.isReadOnly && this.diagram.allowMove;
    }

    // override to move Links (which are all assumed to be MessageLinks) by
    // updating their Link.data.time property so that their link routes will
    // have the correct vertical position
    moveParts(parts, offset, check) {
        super.moveParts(parts, offset, check);
        const it = parts.iterator;
        while (it.next()) {
            if (it.key instanceof go.Link) {
                const link = it.key;
                const startY = it.value.point.y;  // DraggingInfo.point.y
                let y = startY + offset.y;  // determine new Y coordinate value for this link
                const cellY = this.gridSnapCellSize.height;
                y = Math.round(y / cellY) * cellY;  // snap to multiple of gridSnapCellSize.height
                const t = Math.max(0, convertYToTime(y));
                link.diagram.model.set(link.data, "time", t);
                link.invalidateRoute();
            }
        }
    }
}
// end MessageDraggingTool

function showLinkLabel(e) {
    var label = e.subject.findObject("LABEL");
    if (label !== null) label.visible = (e.subject.fromNode.data.category === "paralelo");
}

// Mostrar el modelo del diagrama en formato JSON que el usuario puede editar
function save() {
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    myDiagram.isModified = false;
}
function load(x) {
    myDiagram.model = go.Model.fromJson(x);
}
// imprime el diagrama abriendo una nueva ventana que contiene imágenes SVG del contenido del diagrama para cada página
function guardar() {
    localStorage.setItem("diagrama", JSON.stringify(myDiagram.model.toJson()));

}
function abrir() {
    dig = JSON.parse(localStorage.getItem("diagrama"));
    load(dig);
}
function printDiagram() {
    var svgWindow = window.open();
    if (!svgWindow) return;  // error al abrir una nueva ventana
    var printSize = new go.Size(700, 960);
    var bnds = myDiagram.documentBounds;
    var x = bnds.x;
    var y = bnds.y;
    while (y < bnds.bottom) {
        while (x < bnds.right) {
            var svg = myDiagram.makeSvg({ scale: 1.0, position: new go.Point(x, y), size: printSize });
            svgWindow.document.body.appendChild(svg);
            x += printSize.width;
        }
        x = bnds.x;
        y += printSize.height;
    }
    setTimeout(() => svgWindow.print(), 1);

}

function myCallback(blob) {
    var url = window.URL.createObjectURL(blob);
    var filename = "ImagenDiagrama.png";

    var a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = filename;

    // IE 11
    if (window.navigator.msSaveBlob !== undefined) {
        window.navigator.msSaveBlob(blob, filename);
        return;
    }

    document.body.appendChild(a);
    requestAnimationFrame(() => {
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
}

function nodeStyle() {
    return [
        // El Nodo.ubicación proviene de la propiedad "loc" de los datos del nodo,
        // convertido por el método estático Point.parse.
        // Si se cambia Node.location, actualiza la propiedad "loc" de los datos del nodo,
        // convertir de nuevo usando el método estático Point.stringify.
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        {
            // la ubicación del nodo está en el centro de cada nodo
            locationSpot: go.Spot.Center
        }
    ];
}

function makeBlob() {
    var blob = myDiagram.makeImageData({ background: "white", returnType: "blob", callback: myCallback });
}

function descargarArchivoEAP() {
    // Obtén el contenido del diagrama en formato JSON
    var jsonData = myDiagram.model.toJson();

    // Crea un objeto Blob con el contenido JSON
    var blob = new Blob([jsonData], { type: 'application/json' });

    // Crea un objeto URL para el blob
    var url = URL.createObjectURL(blob);

    // Crea un elemento de enlace para la descarga
    var link = document.createElement('a');
    link.href = url;
    link.download = 'diagrama.eap'; // Nombre del archivo .eap a descargar
    link.style.display = 'none';

    // Agrega el enlace al documento
    document.body.appendChild(link);

    // Simula un clic en el enlace para iniciar la descarga
    link.click();

    // Elimina el enlace del documento
    document.body.removeChild(link);
}

window.addEventListener('DOMContentLoaded', init);