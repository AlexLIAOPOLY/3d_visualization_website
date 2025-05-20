// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const graphElement = document.getElementById('3d-graph');
    const graph2dElement = document.getElementById('2d-graph');
    const resetCameraButton = document.getElementById('reset-camera');
    const highlightGroupSelect = document.getElementById('highlight-group');
    const filterCategorySelect = document.getElementById('filter-category');
    const showLabelsCheckbox = document.getElementById('show-labels');
    const view3dButton = document.getElementById('view-3d');
    const view2dButton = document.getElementById('view-2d');
    const legendPanel = document.getElementById('legend-panel');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const toggleLegendButton = document.getElementById('toggle-legend');
    
    // Make legend panel visible by default (comment this line to hide by default)
    // legendPanel.classList.add('visible');
    
    // Set initial legend state
    legendPanel.classList.add('visible');
    toggleLegendButton.textContent = 'Hide Legend';
    
    // Toggle legend panel functionality
    toggleLegendButton.addEventListener('click', () => {
        const isVisible = legendPanel.classList.contains('visible');
        
        if (isVisible) {
            legendPanel.classList.remove('visible');
            toggleLegendButton.textContent = 'Show Legend';
        } else {
            legendPanel.classList.add('visible');
            toggleLegendButton.textContent = 'Hide Legend';
        }
    });
    
    // Track current view mode
    let viewMode = '3d';
    
    // Track current zoom levels
    let zoom3DLevel = 1.0;
    let zoom2DLevel = 1.0;
    const zoomStep = 0.15; // 15% zoom per click
    const maxZoom = 3.0;  // Max zoom level
    const minZoom = 0.5;  // Min zoom level
    
    // Initialize tooltip style (make more visible)
    const tooltipStyle = {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: '#fff',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
        maxWidth: '300px',
        border: '2px solid #fff',
        zIndex: 1000,
        pointerEvents: 'none'
    };
    
    // Default to not showing labels
    showLabelsCheckbox.checked = false;
    
    // Initialize 3D force-directed graph
    const Graph3D = ForceGraph3D()
        (graphElement)
        .graphData(graphData)
        .backgroundColor('#ffffff')
        .nodeLabel(node => `${node.name}\n${node.description}`)
        .nodeColor(node => nodeColorMap[node.group])
        .nodeVal('size')
        .nodeResolution(16) // Higher node quality
        .linkWidth(link => Math.sqrt(link.value) * 0.5)
        .linkOpacity(0.6)
        .linkDirectionalParticles(link => Math.round(link.value / 2))
        .linkDirectionalParticleWidth(link => Math.sqrt(link.value) * 0.5)
        .linkDirectionalParticleSpeed(0.004)
        .linkLabel(link => `${link.source.name} → ${link.target.name}: ${link.description}`)
        .linkDirectionalArrowLength(3.5)
        .linkDirectionalArrowRelPos(1)
        .linkCurvature(0.25)
        .onNodeHover(node => {
            graphElement.style.cursor = node ? 'pointer' : null;
        })
        .onLinkHover(link => {
            graphElement.style.cursor = link ? 'pointer' : null;
        });
    
    // Initialize 2D force-directed graph
    const Graph2D = ForceGraph()
        (graph2dElement)
        .graphData(graphData)
        .backgroundColor('#f8f8f8') // Lighter background for better contrast
        .nodeId('id')
        .nodeLabel(node => `${node.name}\n${node.description}`)
        .nodeColor(node => nodeColorMap[node.group])
        .nodeVal('size')
        .linkWidth(link => Math.sqrt(link.value) * 1) // Increase line thickness
        .linkColor(() => '#888888') // Darker line color
        .linkDirectionalArrowLength(5) // Larger arrow
        .linkDirectionalArrowRelPos(1)
        .linkCurvature(0.3) // Increase curvature
        .nodeCanvasObject((node, ctx, globalScale) => {
            // Draw node circle
            const size = Math.sqrt(node.size) * 2; // Increase node size
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
            ctx.fillStyle = nodeColorMap[node.group];
            ctx.fill();
            
            // Add node border for better visual effect
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw border for main app
            if (node.id === 'main_app') {
                ctx.beginPath();
                ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            // Draw node label if enabled
            if (showLabelsCheckbox.checked) {
                const fontSize = node.id === 'main_app' ? 14 : 12; // Smaller font size
                ctx.font = `bold ${fontSize}px Sans-Serif`; 
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Create more compact label
                const textWidth = ctx.measureText(node.name).width;
                const bgPadding = 4; // Reduced padding
                
                const labelHeight = fontSize + bgPadding*2;
                const labelWidth = textWidth + bgPadding*2;
                const labelX = node.x - labelWidth/2;
                const labelY = node.y + size + 2;
                
                // Create rounded rectangle
                ctx.beginPath();
                const radius = 4;
                ctx.moveTo(labelX + radius, labelY);
                ctx.lineTo(labelX + labelWidth - radius, labelY);
                ctx.quadraticCurveTo(labelX + labelWidth, labelY, labelX + labelWidth, labelY + radius);
                ctx.lineTo(labelX + labelWidth, labelY + labelHeight - radius);
                ctx.quadraticCurveTo(labelX + labelWidth, labelY + labelHeight, labelX + labelWidth - radius, labelY + labelHeight);
                ctx.lineTo(labelX + radius, labelY + labelHeight);
                ctx.quadraticCurveTo(labelX, labelY + labelHeight, labelX, labelY + labelHeight - radius);
                ctx.lineTo(labelX, labelY + radius);
                ctx.quadraticCurveTo(labelX, labelY, labelX + radius, labelY);
                ctx.closePath();
                
                // Use white shadow to improve readability
                ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Fill label background color with semi-transparent color
                const groupColor = nodeColorMap[node.group];
                // Convert color to RGBA to add transparency
                let r = parseInt(groupColor.slice(1, 3), 16);
                let g = parseInt(groupColor.slice(3, 5), 16);
                let b = parseInt(groupColor.slice(5, 7), 16);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
                ctx.fill();
                
                // Draw label text
                ctx.shadowColor = 'transparent'; // Remove text shadow
                ctx.fillStyle = '#ffffff';
                ctx.fillText(node.name, node.x, labelY + labelHeight/2);
                
                // Add special indicator for main_app
                if (node.id === 'main_app') {
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        })
        .onNodeHover(node => {
            graph2dElement.style.cursor = node ? 'pointer' : null;
            
            // Show hover tooltip
            if (node) {
                // Remove old tooltip
                const oldTooltip = document.getElementById('node-tooltip');
                if (oldTooltip) oldTooltip.remove();
                
                // Create new tooltip
                const tooltip = document.createElement('div');
                tooltip.id = 'node-tooltip';
                tooltip.style.position = 'absolute';
                tooltip.style.left = `${node.x + 20}px`;
                tooltip.style.top = `${node.y - 40}px`;
                tooltip.style.backgroundColor = 'rgba(0,0,0,0.9)';
                tooltip.style.color = '#fff';
                tooltip.style.padding = '10px 15px';
                tooltip.style.borderRadius = '6px';
                tooltip.style.fontSize = '16px';
                tooltip.style.fontWeight = 'bold';
                tooltip.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
                tooltip.style.zIndex = '1000';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.border = '2px solid #fff';
                tooltip.innerHTML = `<strong>${node.name}</strong><br>${node.description}`;
                
                graph2dElement.appendChild(tooltip);
            } else {
                // Remove tooltip
                const tooltip = document.getElementById('node-tooltip');
                if (tooltip) tooltip.remove();
            }
        })
        .onLinkHover(link => {
            graph2dElement.style.cursor = link ? 'pointer' : null;
            
            // Show link hover tooltip
            if (link) {
                // Remove old tooltip
                const oldTooltip = document.getElementById('link-tooltip');
                if (oldTooltip) oldTooltip.remove();
                
                // Calculate link midpoint
                const sourceNode = typeof link.source === 'object' ? link.source : Graph2D.graphData().nodes.find(n => n.id === link.source);
                const targetNode = typeof link.target === 'object' ? link.target : Graph2D.graphData().nodes.find(n => n.id === link.target);
                const x = (sourceNode.x + targetNode.x) / 2;
                const y = (sourceNode.y + targetNode.y) / 2;
                
                // Create new tooltip
                const tooltip = document.createElement('div');
                tooltip.id = 'link-tooltip';
                tooltip.style.position = 'absolute';
                tooltip.style.left = `${x}px`;
                tooltip.style.top = `${y - 30}px`;
                tooltip.style.backgroundColor = 'rgba(0,0,0,0.9)';
                tooltip.style.color = '#fff';
                tooltip.style.padding = '10px 15px';
                tooltip.style.borderRadius = '6px';
                tooltip.style.fontSize = '16px';
                tooltip.style.fontWeight = 'bold';
                tooltip.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
                tooltip.style.zIndex = '1000';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.border = '2px solid #fff';
                tooltip.style.textAlign = 'center';
                tooltip.innerHTML = `${sourceNode.name} → ${targetNode.name}${link.description ? '<br>' + link.description : ''}`;
                
                graph2dElement.appendChild(tooltip);
            } else {
                // Remove tooltip
                const tooltip = document.getElementById('link-tooltip');
                if (tooltip) tooltip.remove();
            }
        });
    
    // Fix SpriteText import issue
    if (typeof SpriteText === 'undefined') {
        window.SpriteText = THREE.SpriteText || 
                           window.ThreeSpriteText || 
                           { prototype: { constructor: function(){} } };
    }
    
    // Customize force simulation to place main_app at center
    Graph3D.d3Force('center', d3.forceCenter())
    .d3Force('charge', d3.forceManyBody()
        .strength(node => node.id === 'main_app' ? -300 : -100)
    );
    
    // Also center main_app in 2D view
    Graph2D.d3Force('center', d3.forceCenter())
    .d3Force('charge', d3.forceManyBody()
        .strength(node => node.id === 'main_app' ? -400 : -150) // Increased repulsion
    );
    
    // Fix the main app in the center for both views
    Graph3D.d3Force('radial', d3.forceRadial(0).strength(node => 
        node.id === 'main_app' ? 1 : 0
    ));
    
    Graph2D.d3Force('radial', d3.forceRadial(0).strength(node => 
        node.id === 'main_app' ? 1 : 0
    ));

    // Add custom positioning to ensure other nodes arrange around main_app
    const mainAppNode = graphData.nodes.find(node => node.id === 'main_app');
    if (mainAppNode) {
        mainAppNode.fx = 0;
        mainAppNode.fy = 0;
        if (viewMode === '3d') {
            mainAppNode.fz = 0;
        }
    }
    
    // Optimize core dependency relationships
    optimizeRelationships();
    
    // Add node icons and proper sizing with direct THREE usage
    Graph3D.nodeThreeObject(node => {
        const group = new THREE.Group();
        
        // Create sphere as node background
        const sphereGeometry = new THREE.SphereGeometry(
            node.id === 'main_app' ? node.size / 2.5 : node.size / 3, 
            16, 
            16
        );
        
        const sphereMaterial = new THREE.MeshLambertMaterial({
            color: nodeColorMap[node.group],
            transparent: true,
            opacity: node.id === 'main_app' ? 0.85 : 0.75
        });
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        // Add a highlight effect for the main app
        if (node.id === 'main_app') {
            const highlightGeometry = new THREE.SphereGeometry(node.size / 2.3, 16, 16);
            const highlightMaterial = new THREE.MeshBasicMaterial({
                color: '#ffffff',
                transparent: true,
                opacity: 0.2
            });
            const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
            group.add(highlight);
        }
        
        group.add(sphere);
        
        // Add text labels if enabled - using THREE.Sprite directly
        if (showLabelsCheckbox.checked) {
            // Create canvas for text rendering
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const fontSize = node.id === 'main_app' ? 24 : 16;
            ctx.font = `bold ${fontSize}px Arial`;
            
            // Measure text for proper sizing
            const textWidth = ctx.measureText(node.name).width;
            const padding = 8;
            
            // Size canvas appropriately
            canvas.width = textWidth + padding * 2;
            canvas.height = fontSize + padding * 2;
            
            // Draw background
            ctx.fillStyle = nodeColorMap[node.group];
            ctx.roundRect(0, 0, canvas.width, canvas.height, 5);
            ctx.fill();
            
            // Draw text
            ctx.fillStyle = 'white';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.name, canvas.width / 2, canvas.height / 2);
            
            // Create sprite using canvas
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            
            // Scale sprite based on node size
            const scale = node.id === 'main_app' ? 15 : 10;
            sprite.scale.set(scale, scale * canvas.height / canvas.width, 1);
            
            // Position above the node
            sprite.position.y = (node.id === 'main_app' ? node.size / 2 + 4 : node.size / 2 + 1.5);
            
            group.add(sprite);
        }
        
        return group;
    });
    
    // Add hover interaction to both graphs
    addHoverInteraction(Graph3D);
    addHoverInteraction2D(Graph2D);
    
    // Add group filtering functionality to both graphs
    highlightGroupSelect.addEventListener('change', () => {
        // Apply filtering based on both group and category
        applyFilters();
    });
    
    // Add category filtering functionality to both graphs
    filterCategorySelect.addEventListener('change', () => {
        // Apply filtering based on both group and category
        applyFilters();
    });
    
    // Function to apply both group and category filters
    function applyFilters() {
        const groupValue = highlightGroupSelect.value;
        const categoryValue = filterCategorySelect.value;
        
        if (viewMode === '3d') {
            filterGraph3D(Graph3D, groupValue, categoryValue);
        } else {
            filterGraph2D(Graph2D, groupValue, categoryValue);
        }
    }
    
    // Add label show/hide functionality
    showLabelsCheckbox.addEventListener('change', () => {
        if (viewMode === '3d') {
            Graph3D.refresh();
        } else {
            Graph2D.refresh();
        }
    });
    
    // Zoom in button functionality
    zoomInButton.addEventListener('click', () => {
        if (viewMode === '3d') {
            // 尝试最直接的方式 - 获取内部THREE.js相机并直接修改缩放
            try {
                // 获取图形内部的THREE.js对象
                const distance = Graph3D.cameraPosition().z;
                
                // 通过改变相机位置进行缩放
                Graph3D.cameraPosition({
                    x: Graph3D.cameraPosition().x * 0.9,
                    y: Graph3D.cameraPosition().y * 0.9,
                    z: distance * 0.9
                });
                
                // 尝试访问和修改内部three.js场景
                if (Graph3D.scene && Graph3D.scene() && Graph3D.scene().scale) {
                    const currentScale = Graph3D.scene().scale.x || 1;
                    Graph3D.scene().scale.set(currentScale * 1.1, currentScale * 1.1, currentScale * 1.1);
                }
            } catch (e) {
                console.error("缩放操作失败:", e);
            }
        } else {
            // For 2D view
            zoom2DLevel = Math.min(zoom2DLevel * 1.15, maxZoom);
            Graph2D.zoom(zoom2DLevel, 300);
        }
    });
    
    // Zoom out button functionality
    zoomOutButton.addEventListener('click', () => {
        if (viewMode === '3d') {
            // 尝试最直接的方式 - 获取内部THREE.js相机并直接修改缩放
            try {
                // 获取图形内部的THREE.js对象
                const distance = Graph3D.cameraPosition().z;
                
                // 通过改变相机位置进行缩放
                Graph3D.cameraPosition({
                    x: Graph3D.cameraPosition().x * 1.1,
                    y: Graph3D.cameraPosition().y * 1.1,
                    z: distance * 1.1
                });
                
                // 尝试访问和修改内部three.js场景
                if (Graph3D.scene && Graph3D.scene() && Graph3D.scene().scale) {
                    const currentScale = Graph3D.scene().scale.x || 1;
                    Graph3D.scene().scale.set(currentScale * 0.9, currentScale * 0.9, currentScale * 0.9);
                }
            } catch (e) {
                console.error("缩放操作失败:", e);
            }
        } else {
            // For 2D view
            zoom2DLevel = Math.max(zoom2DLevel / 1.15, minZoom);
            Graph2D.zoom(zoom2DLevel, 300);
        }
    });
    
    // Reset camera view
    resetCameraButton.addEventListener('click', () => {
        if (viewMode === '3d') {
            // Reset zoom level
            zoom3DLevel = 1.0;
            
            // Calculate optimal camera position
            const graphBoundingSphere = getBoundingSphere(graphData.nodes);
            const distance = graphBoundingSphere.radius * 2.5;
            
            Graph3D.cameraPosition(
                { x: distance, y: distance / 3, z: distance }, // Dynamic camera position
                { x: 0, y: 0, z: 0 },      // Look at origin
                2000                        // Transition time (ms)
            );
            
            // Re-enable auto-rotation
            Graph3D.controls().autoRotate = true;
        } else {
            // Reset 2D view to fit all nodes
            zoom2DLevel = 1.0;
            fitGraph2DToNodes();
        }
    });
    
    // Initial camera position
    setTimeout(() => {
        // Adjust 3D camera to fit all nodes
        const graphBoundingSphere = getBoundingSphere(graphData.nodes);
        const distance = graphBoundingSphere.radius * 2.5;
        Graph3D.cameraPosition(
            { x: distance, y: distance / 3, z: distance },
            { x: 0, y: 0, z: 0 },
            0
        );
        
        // Also show legend in 3D view initially
        document.getElementById('legend-panel').classList.add('visible');
    }, 200);
    
    // Calculate bounding sphere for a set of nodes
    function getBoundingSphere(nodes) {
        // Find min/max coordinates
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        
        nodes.forEach(node => {
            const x = node.x || 0;
            const y = node.y || 0;
            const z = node.z || 0;
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            minZ = Math.min(minZ, z);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            maxZ = Math.max(maxZ, z);
        });
        
        // Calculate center of bounding box
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;
        
        // Calculate radius based on furthest point
        let radius = 0;
        nodes.forEach(node => {
            const x = node.x || 0;
            const y = node.y || 0;
            const z = node.z || 0;
            
            const distance = Math.sqrt(
                Math.pow(x - centerX, 2) + 
                Math.pow(y - centerY, 2) + 
                Math.pow(z - centerZ, 2)
            );
            
            radius = Math.max(radius, distance);
        });
        
        return {
            center: { x: centerX, y: centerY, z: centerZ },
            radius: radius || 100 // Default radius if calculation fails
        };
    }
    
    // Add mouse interaction for node clicks
    Graph3D.onNodeClick(node => {
        handleNodeClick(node, Graph3D);
    });
    
    Graph2D.onNodeClick(node => {
        handleNodeClick(node, Graph2D);
    });
    
    // Function to handle node clicks in both views
    function handleNodeClick(node, graph) {
        // First click: focus on node
        if (!node.hasBeenClicked) {
            node.hasBeenClicked = true;
            // Highlight the current node and its connections
            if (viewMode === '3d') {
                highlightNodeAndLinks(graph, node);
                
                // Move camera to node position
                const distance = 40;
                const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
                graph.cameraPosition(
                    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                    node,
                    1000
                );
                
                // Pause auto-rotation when focusing on a node
                graph.controls().autoRotate = false;
            } else {
                highlightNodeAndLinks2D(graph, node);
                // Center on node in 2D view
                graph.centerAt(node.x, node.y, 1000);
                graph.zoom(1.5, 1000);
            }
            
            // Show node details panel
            showNodeDetails(node);
        } else {
            // Second click: reset view
            node.hasBeenClicked = false;
            if (viewMode === '3d') {
                resetHighlight(graph);
                // Resume auto-rotation
                graph.controls().autoRotate = true;
            } else {
                resetHighlight2D(graph);
            }
            hideNodeDetails();
        }
    }
    
    // Auto-rotate view - fix for consistent rotation
    let angle = 0;
    const rotateView = () => {
        if (viewMode === '3d' && Graph3D.controls().autoRotate) {
            angle += Math.PI / 600;
            Graph3D.cameraPosition({
                x: 120 * Math.cos(angle),
                y: 30,
                z: 120 * Math.sin(angle)
            });
        }
        requestAnimationFrame(rotateView);
    };
    
    // Start the animation loop
    rotateView();
    
    // Initially enable auto-rotation with proper settings
    Graph3D.controls().autoRotate = true;
    Graph3D.controls().autoRotateSpeed = 0.5;
    
    // Stop auto-rotation when user interacts with controls
    graphElement.addEventListener('mousedown', () => {
        Graph3D.controls().autoRotate = false;
    });
    
    // View toggle functionality
    view3dButton.addEventListener('click', () => {
        if (viewMode !== '3d') {
            viewMode = '3d';
            graph2dElement.style.display = 'none';
            graphElement.style.display = 'block';
            view3dButton.classList.add('active');
            view2dButton.classList.remove('active');
            resetCameraButton.textContent = 'Reset View';
            
            // Don't force legend visibility on view change
            // Instead, maintain current legend visibility state
            const isLegendVisible = legendPanel.classList.contains('visible');
            if (isLegendVisible) {
                toggleLegendButton.textContent = 'Hide Legend';
            } else {
                toggleLegendButton.textContent = 'Show Legend';
            }
            
            // Apply current filters to 3D view
            applyFilters();
            
            // Reset camera position to fit all nodes
            const graphBoundingSphere = getBoundingSphere(graphData.nodes);
            const distance = graphBoundingSphere.radius * 2.5;
            Graph3D.cameraPosition(
                { x: distance, y: distance / 3, z: distance },
                { x: 0, y: 0, z: 0 },
                1000
            );
            
            // Enable auto-rotation
            Graph3D.controls().autoRotate = true;
        }
    });
    
    view2dButton.addEventListener('click', () => {
        if (viewMode !== '2d') {
            viewMode = '2d';
            graphElement.style.display = 'none';
            graph2dElement.style.display = 'block';
            view2dButton.classList.add('active');
            view3dButton.classList.remove('active');
            resetCameraButton.textContent = 'Center View';
            fitGraph2DToNodes();
            
            // Don't force legend visibility on view change
            // Instead, maintain current legend visibility state
            const isLegendVisible = legendPanel.classList.contains('visible');
            if (isLegendVisible) {
                toggleLegendButton.textContent = 'Hide Legend';
            } else {
                toggleLegendButton.textContent = 'Show Legend';
            }
            
            // Apply current filters to 2D view
            applyFilters();
            
            // Fit the 2D view to include all nodes
            fitGraph2DToNodes();
        }
    });
    
    // Function to optimize relationships based on system architecture
    function optimizeRelationships() {
        // Strengthen core application dependencies
        graphData.links.forEach(link => {
            // Main app is central - increase connection to key modules
            if (link.source === 'main_app' && 
                (link.target === 'pydlw' || link.target === 'simulation' || link.target === 'opc')) {
                link.value *= 1.3;
            }
            
            // Strengthen 3D editor connections
            if ((link.source === '3d_editor' && link.target === 'shape_analysis') ||
                (link.source === 'shape_analysis' && link.target === '3d_editor')) {
                link.value *= 1.2;
            }
            
            // Data flow is critical - strengthen these connections
            if (link.target === 'export_files' || link.source === 'input_files') {
                link.value *= 1.15;
            }
        });
        
        // Update graph data to reflect changes
        Graph3D.graphData(graphData);
        Graph2D.graphData(graphData);
    }
    
    // Function to fit the 2D graph to show all nodes
    function fitGraph2DToNodes() {
        // Get node positions
        const nodes = Graph2D.graphData().nodes;
        if (!nodes.length) return;
        
        // Find the graph bounds
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        nodes.forEach(node => {
            if (node.x === undefined || node.y === undefined) return;
            
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
        });
        
        // Calculate center and zoom
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // Calculate zoom to fit all nodes with some padding
        const width = window.innerWidth;
        const height = window.innerHeight;
        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        
        // Ensure graph dimensions are valid
        if (graphWidth <= 0 || graphHeight <= 0) return;
        
        // Calculate target zoom based on dimensions
        const paddingFactor = 0.8; // Leaves 10% padding on each side
        const zoomX = (width / graphWidth) * paddingFactor;
        const zoomY = (height / graphHeight) * paddingFactor;
        const zoom = Math.min(zoomX, zoomY, 2); // Cap zoom to avoid excessive zooming
        
        // Apply the calculated center and zoom
        Graph2D.centerAt(centerX, centerY, 1000);
        Graph2D.zoom(zoom, 1000);
    }
    
    // Initialize the 2D view to fit all nodes
    setTimeout(() => {
        if (viewMode === '2d') {
            fitGraph2DToNodes();
        }
    }, 1000); // Delay to ensure nodes have positions
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Prevent handling if in an input field
        if (event.target.tagName === 'INPUT' || 
            event.target.tagName === 'TEXTAREA' || 
            event.target.tagName === 'SELECT') {
            return;
        }
        
        switch(event.key) {
            case '+':
            case '=':
                // Zoom in with + key
                zoomInButton.click();
                break;
            case '-':
            case '_':
                // Zoom out with - key
                zoomOutButton.click();
                break;
            case 'r':
            case 'R':
                // Reset view with R key
                resetCameraButton.click();
                break;
            case 'l':
            case 'L':
                // Toggle legend with L key
                toggleLegendButton.click();
                break;
            case '3':
                // Switch to 3D view with 3 key
                view3dButton.click();
                break;
            case '2':
                // Switch to 2D view with 2 key
                view2dButton.click();
                break;
        }
    });
});

// Add hover interaction effect for 3D graph
function addHoverInteraction(Graph) {
    // Store the state of nodes and links before highlighting
    let highlightedNodes = new Set();
    let highlightedLinks = new Set();
    let prevHoverNode = null;
    let prevHoverLink = null;
    
    // Node hover handling
    Graph.onNodeHover(node => {
        // If hover node hasn't changed, don't do anything
        if (prevHoverNode === node) return;
        
        // Reset previous highlighting
        resetHighlightedNodesAndLinks(Graph, highlightedNodes, highlightedLinks);
        highlightedNodes.clear();
        highlightedLinks.clear();
        
        // If there's a new hover node, highlight it and related links
        if (node) {
            highlightedNodes.add(node);
            
            // Highlight related links and connected nodes
            Graph.graphData().links.forEach(link => {
                if (link.source === node || link.target === node) {
                    highlightedLinks.add(link);
                    highlightedNodes.add(link.source === node ? link.target : link.source);
                }
            });
            
            // Apply highlight style
            applyHighlight(Graph, highlightedNodes, highlightedLinks);
        }
        
        prevHoverNode = node;
    });
    
    // Link hover handling
    Graph.onLinkHover(link => {
        // If hover link hasn't changed, don't do anything
        if (prevHoverLink === link) return;
        
        // Reset previous highlighting
        resetHighlightedNodesAndLinks(Graph, highlightedNodes, highlightedLinks);
        highlightedNodes.clear();
        highlightedLinks.clear();
        
        // If there's a new hover link, highlight it and related nodes
        if (link) {
            highlightedLinks.add(link);
            highlightedNodes.add(link.source);
            highlightedNodes.add(link.target);
            
            // Apply highlight style
            applyHighlight(Graph, highlightedNodes, highlightedLinks);
        }
        
        prevHoverLink = link;
    });
}

// Add hover interaction effect for 2D graph
function addHoverInteraction2D(Graph) {
    // Store the state of nodes and links before highlighting
    let highlightedNodes = new Set();
    let highlightedLinks = new Set();
    let prevHoverNode = null;
    let prevHoverLink = null;
    
    // Node hover handling
    Graph.onNodeHover(node => {
        // If hover node hasn't changed, don't do anything
        if (prevHoverNode === node) return;
        
        // Reset previous highlighting
        resetHighlightedNodesAndLinks2D(Graph, highlightedNodes, highlightedLinks);
        highlightedNodes.clear();
        highlightedLinks.clear();
        
        // If there's a new hover node, highlight it and related links
        if (node) {
            highlightedNodes.add(node);
            
            // Highlight related links and connected nodes
            Graph.graphData().links.forEach(link => {
                const sourceId = link.source.id || link.source;
                const targetId = link.target.id || link.target;
                const nodeId = node.id;
                
                if (sourceId === nodeId || targetId === nodeId) {
                    highlightedLinks.add(link);
                    const connectedNode = Graph.graphData().nodes.find(n => 
                        n.id === (sourceId === nodeId ? targetId : sourceId)
                    );
                    highlightedNodes.add(connectedNode);
                }
            });
            
            // Apply highlight style
            applyHighlight2D(Graph, highlightedNodes, highlightedLinks);
        }
        
        prevHoverNode = node;
    });
    
    // Link hover handling
    Graph.onLinkHover(link => {
        // If hover link hasn't changed, don't do anything
        if (prevHoverLink === link) return;
        
        // Reset previous highlighting
        resetHighlightedNodesAndLinks2D(Graph, highlightedNodes, highlightedLinks);
        highlightedNodes.clear();
        highlightedLinks.clear();
        
        // If there's a new hover link, highlight it and related nodes
        if (link) {
            highlightedLinks.add(link);
            const sourceNode = Graph.graphData().nodes.find(n => n.id === (link.source.id || link.source));
            const targetNode = Graph.graphData().nodes.find(n => n.id === (link.target.id || link.target));
            highlightedNodes.add(sourceNode);
            highlightedNodes.add(targetNode);
            
            // Apply highlight style
            applyHighlight2D(Graph, highlightedNodes, highlightedLinks);
        }
        
        prevHoverLink = link;
    });
}

// Apply highlight styles for 3D
function applyHighlight(Graph, highlightedNodes, highlightedLinks) {
    // Set node opacity
    Graph.nodeOpacity(node => {
        // Always keep main_app visible
        if (node.id === 'main_app') return 1;
        return highlightedNodes.has(node) ? 1 : 0.2;
    });
    
    // Set link opacity and width
    Graph.linkOpacity(link => highlightedLinks.has(link) ? 0.8 : 0.1);
    Graph.linkWidth(link => highlightedLinks.has(link) ? Math.sqrt(link.value) * 1.5 : Math.sqrt(link.value) * 0.3);
    
    // Set link particle effect
    Graph.linkDirectionalParticles(link => highlightedLinks.has(link) ? 6 : 0);
}

// Apply highlight styles for 2D
function applyHighlight2D(Graph, highlightedNodes, highlightedLinks) {
    // Force a re-render that uses our highlight sets
    Graph.nodeColor(node => {
        if (node.id === 'main_app') return nodeColorMap[node.group];
        return highlightedNodes.has(node) ? nodeColorMap[node.group] : '#dddddd';
    });
    
    Graph.linkColor(link => highlightedLinks.has(link) ? '#666666' : '#eeeeee');
    Graph.linkWidth(link => highlightedLinks.has(link) ? Math.sqrt(link.value) * 1.5 : Math.sqrt(link.value) * 0.3);
    Graph.linkDirectionalParticles(link => highlightedLinks.has(link) ? 6 : 0);
}

// Reset highlight styles for 3D
function resetHighlightedNodesAndLinks(Graph, highlightedNodes, highlightedLinks) {
    // Restore all nodes and links to original style
    Graph.nodeOpacity(1);
    Graph.linkOpacity(0.6);
    Graph.linkWidth(link => Math.sqrt(link.value) * 0.5);
    Graph.linkDirectionalParticles(link => Math.round(link.value / 2));
}

// Reset highlight styles for 2D
function resetHighlightedNodesAndLinks2D(Graph, highlightedNodes, highlightedLinks) {
    // Restore all nodes and links to original style
    Graph.nodeColor(node => nodeColorMap[node.group]);
    Graph.linkColor(() => '#cccccc');
    Graph.linkWidth(link => Math.sqrt(link.value) * 0.5);
    Graph.linkDirectionalParticles(link => Math.round(link.value / 2));
}

// Filter nodes by group in 3D
function highlightGroup(Graph, groupName) {
    const graphData = Graph.graphData();
    
    if (!groupName) {
        // Reset to show all nodes and links
        Graph.nodeOpacity(1);
        Graph.linkOpacity(0.6);
        
        // Restore initial link width
        Graph.linkWidth(link => Math.sqrt(link.value) * 0.5);
        Graph.linkDirectionalParticles(link => Math.round(link.value / 2));
        
        return;
    }
    
    // Get node IDs of the specified group
    const groupNodeIds = graphData.nodes
        .filter(n => n.group === groupName)
        .map(n => n.id);
    
    // Also include main_app in all groups for context
    if (!groupNodeIds.includes('main_app')) {
        groupNodeIds.push('main_app');
    }
    
    // Get links containing nodes of the specified group
    const groupLinks = graphData.links.filter(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return groupNodeIds.includes(sourceId) || groupNodeIds.includes(targetId);
    });
    
    // Set node opacity
    Graph.nodeOpacity(node => {
        // Always keep main_app visible
        if (node.id === 'main_app') return 1;
        return groupNodeIds.includes(node.id) ? 1 : 0.15;
    });
    
    // Set link opacity and width
    Graph.linkOpacity(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (groupNodeIds.includes(sourceId) || groupNodeIds.includes(targetId)) ? 0.8 : 0.05;
    });
    
    Graph.linkWidth(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (groupNodeIds.includes(sourceId) && groupNodeIds.includes(targetId)) ? 
            Math.sqrt(link.value) * 1.5 : Math.sqrt(link.value) * 0.3;
    });
    
    // Set link particle effect
    Graph.linkDirectionalParticles(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (groupNodeIds.includes(sourceId) && groupNodeIds.includes(targetId)) ? 6 : 0;
    });
}

// Filter nodes by group in 2D
function highlightGroup2D(Graph, groupName) {
    const graphData = Graph.graphData();
    
    if (!groupName) {
        // Reset to show all nodes and links
        Graph.nodeColor(node => nodeColorMap[node.group]);
        Graph.linkColor(() => '#cccccc');
        Graph.linkWidth(link => Math.sqrt(link.value) * 0.5);
        Graph.linkDirectionalParticles(link => Math.round(link.value / 2));
        return;
    }
    
    // Get node IDs of the specified group
    const groupNodeIds = graphData.nodes
        .filter(n => n.group === groupName)
        .map(n => n.id);
    
    // Also include main_app in all groups for context
    if (!groupNodeIds.includes('main_app')) {
        groupNodeIds.push('main_app');
    }
    
    // Color nodes based on group
    Graph.nodeColor(node => {
        if (node.id === 'main_app') return nodeColorMap[node.group];
        return groupNodeIds.includes(node.id) ? nodeColorMap[node.group] : '#eeeeee';
    });
    
    // Color links based on if they connect group nodes
    Graph.linkColor(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (groupNodeIds.includes(sourceId) && groupNodeIds.includes(targetId)) ? 
            '#666666' : '#eeeeee';
    });
    
    // Adjust link width and particles
    Graph.linkWidth(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (groupNodeIds.includes(sourceId) && groupNodeIds.includes(targetId)) ? 
            Math.sqrt(link.value) * 1.5 : Math.sqrt(link.value) * 0.3;
    });
    
    Graph.linkDirectionalParticles(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (groupNodeIds.includes(sourceId) && groupNodeIds.includes(targetId)) ? 6 : 0;
    });
}

// Focus on a node and its links in 3D
function highlightNodeAndLinks(Graph, clickedNode) {
    const graphData = Graph.graphData();
    const connectedNodeIds = new Set();
    const connectedLinks = new Set();
    
    // Add the clicked node
    connectedNodeIds.add(clickedNode.id);
    
    // Add connected nodes and links
    graphData.links.forEach(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        
        if (sourceId === clickedNode.id || targetId === clickedNode.id) {
            connectedLinks.add(link);
            connectedNodeIds.add(sourceId);
            connectedNodeIds.add(targetId);
        }
    });
    
    // Set node opacity - main_app always visible
    Graph.nodeOpacity(node => {
        if (node.id === 'main_app') return 1;
        return connectedNodeIds.has(node.id) ? 1 : 0.2;
    });
    
    // Set link opacity and width
    Graph.linkOpacity(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return connectedLinks.has(link) ? 0.9 : 0.1;
    });
    
    Graph.linkWidth(link => {
        return connectedLinks.has(link) ? Math.sqrt(link.value) * 2 : Math.sqrt(link.value) * 0.3;
    });
    
    // Set link particle effect
    Graph.linkDirectionalParticles(link => {
        return connectedLinks.has(link) ? 8 : 0;
    });
}

// Focus on a node and its links in 2D
function highlightNodeAndLinks2D(Graph, clickedNode) {
    const graphData = Graph.graphData();
    const connectedNodeIds = new Set();
    const connectedLinks = new Set();
    
    // Add the clicked node
    connectedNodeIds.add(clickedNode.id);
    
    // Add connected nodes and links
    graphData.links.forEach(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        
        if (sourceId === clickedNode.id || targetId === clickedNode.id) {
            connectedLinks.add(link);
            connectedNodeIds.add(sourceId);
            connectedNodeIds.add(targetId);
        }
    });
    
    // Set node colors
    Graph.nodeColor(node => {
        if (node.id === 'main_app') return nodeColorMap[node.group];
        return connectedNodeIds.has(node.id) ? nodeColorMap[node.group] : '#eeeeee';
    });
    
    // Set link colors and width
    Graph.linkColor(link => connectedLinks.has(link) ? '#666666' : '#eeeeee');
    Graph.linkWidth(link => connectedLinks.has(link) ? Math.sqrt(link.value) * 2 : Math.sqrt(link.value) * 0.3);
    Graph.linkDirectionalParticles(link => connectedLinks.has(link) ? 8 : 0);
}

// Reset highlight state for 3D
function resetHighlight(Graph) {
    Graph.nodeOpacity(1);
    Graph.linkOpacity(0.6);
    Graph.linkWidth(link => Math.sqrt(link.value) * 0.5);
    Graph.linkDirectionalParticles(link => Math.round(link.value / 2));
}

// Reset highlight state for 2D
function resetHighlight2D(Graph) {
    Graph.nodeColor(node => nodeColorMap[node.group]);
    Graph.linkColor(() => '#cccccc');
    Graph.linkWidth(link => Math.sqrt(link.value) * 0.5);
    Graph.linkDirectionalParticles(link => Math.round(link.value / 2));
}

// Show node details panel
function showNodeDetails(node) {
    // Check if details panel already exists
    let detailsPanel = document.getElementById('node-details-panel');
    
    // If not, create one
    if (!detailsPanel) {
        detailsPanel = document.createElement('div');
        detailsPanel.id = 'node-details-panel';
        detailsPanel.className = 'node-details-panel';
        document.body.appendChild(detailsPanel);
    }
    
    // Get connection relationships
    const graphData = {
        nodes: window.graphData.nodes,
        links: window.graphData.links
    };
    
    const connections = [];
    
    graphData.links.forEach(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        
        if (sourceId === node.id) {
            const targetNode = graphData.nodes.find(n => n.id === targetId);
            connections.push({
                direction: 'out',
                node: targetNode,
                description: link.description,
                value: link.value
            });
        } else if (targetId === node.id) {
            const sourceNode = graphData.nodes.find(n => n.id === sourceId);
            connections.push({
                direction: 'in',
                node: sourceNode,
                description: link.description,
                value: link.value
            });
        }
    });
    
    // Sort connections by value (strength)
    connections.sort((a, b) => b.value - a.value);
    
    // Update panel content
    detailsPanel.innerHTML = `
        <span class="close-btn">&times;</span>
        <h3 style="color: ${nodeColorMap[node.group]}">${node.name}</h3>
        <p style="margin-bottom: 15px;">${node.description}</p>
        <div>
            <strong>Type:</strong> ${node.category}
        </div>
        <div>
            <strong>Group:</strong> ${node.group}
        </div>
        <div class="connection-list">
            <h4 style="margin-bottom: 10px;">Connections (${connections.length})</h4>
            ${connections.map(conn => `
                <div class="connection-item">
                    <span style="color: ${conn.direction === 'in' ? '#009688' : '#E91E63'}">
                        ${conn.direction === 'in' ? '◄ From' : '► To'}
                    </span>
                    <strong>${conn.node.name}</strong><br>
                    <small>${conn.description} (Strength: ${conn.value})</small>
                </div>
            `).join('')}
        </div>
    `;
    
    // Add close button event
    detailsPanel.querySelector('.close-btn').addEventListener('click', hideNodeDetails);
    
    // Show panel
    setTimeout(() => {
        detailsPanel.classList.add('visible');
    }, 50);
}

// Hide node details panel
function hideNodeDetails() {
    const detailsPanel = document.getElementById('node-details-panel');
    if (detailsPanel) {
        detailsPanel.classList.remove('visible');
        setTimeout(() => {
            if (detailsPanel.parentNode) {
                detailsPanel.parentNode.removeChild(detailsPanel);
            }
        }, 300);
    }
}

// Filter for 3D graph - combine group and category filters
function filterGraph3D(Graph, groupName, categoryName) {
    const graphData = Graph.graphData();
    
    // If no filters are active, show all nodes
    if (!groupName && !categoryName) {
        Graph.nodeOpacity(1);
        Graph.linkOpacity(0.6);
        Graph.linkWidth(link => Math.sqrt(link.value) * 0.5);
        Graph.linkDirectionalParticles(link => Math.round(link.value / 2));
        return;
    }
    
    // Get nodes that match both filters (if specified)
    const matchingNodeIds = graphData.nodes
        .filter(node => {
            const matchesGroup = !groupName || node.group === groupName;
            const matchesCategory = !categoryName || node.category === categoryName;
            return matchesGroup && matchesCategory;
        })
        .map(node => node.id);
    
    // Always include main_app for context
    if (!matchingNodeIds.includes('main_app')) {
        matchingNodeIds.push('main_app');
    }
    
    // Get links connecting matching nodes
    const matchingLinks = graphData.links.filter(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return matchingNodeIds.includes(sourceId) || matchingNodeIds.includes(targetId);
    });
    
    // Set node opacity
    Graph.nodeOpacity(node => {
        // Always keep main_app visible
        if (node.id === 'main_app') return 1;
        return matchingNodeIds.includes(node.id) ? 1 : 0.15;
    });
    
    // Set link opacity and width
    Graph.linkOpacity(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (matchingNodeIds.includes(sourceId) || matchingNodeIds.includes(targetId)) ? 0.8 : 0.05;
    });
    
    Graph.linkWidth(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (matchingNodeIds.includes(sourceId) && matchingNodeIds.includes(targetId)) ? 
            Math.sqrt(link.value) * 1.5 : Math.sqrt(link.value) * 0.3;
    });
    
    // Set link particle effect
    Graph.linkDirectionalParticles(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (matchingNodeIds.includes(sourceId) && matchingNodeIds.includes(targetId)) ? 6 : 0;
    });
}

// Filter for 2D graph - combine group and category filters
function filterGraph2D(Graph, groupName, categoryName) {
    const graphData = Graph.graphData();
    
    // If no filters are active, show all nodes
    if (!groupName && !categoryName) {
        Graph.nodeColor(node => nodeColorMap[node.group]);
        Graph.linkColor(() => '#cccccc');
        Graph.linkWidth(link => Math.sqrt(link.value) * 0.5);
        Graph.linkDirectionalParticles(link => Math.round(link.value / 2));
        return;
    }
    
    // Get nodes that match both filters (if specified)
    const matchingNodeIds = graphData.nodes
        .filter(node => {
            const matchesGroup = !groupName || node.group === groupName;
            const matchesCategory = !categoryName || node.category === categoryName;
            return matchesGroup && matchesCategory;
        })
        .map(node => node.id);
    
    // Always include main_app for context
    if (!matchingNodeIds.includes('main_app')) {
        matchingNodeIds.push('main_app');
    }
    
    // Color nodes based on matches
    Graph.nodeColor(node => {
        if (node.id === 'main_app') return nodeColorMap[node.group];
        return matchingNodeIds.includes(node.id) ? nodeColorMap[node.group] : '#eeeeee';
    });
    
    // Color links based on if they connect matching nodes
    Graph.linkColor(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (matchingNodeIds.includes(sourceId) && matchingNodeIds.includes(targetId)) ? 
            '#666666' : '#eeeeee';
    });
    
    // Adjust link width and particles
    Graph.linkWidth(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (matchingNodeIds.includes(sourceId) && matchingNodeIds.includes(targetId)) ? 
            Math.sqrt(link.value) * 1.5 : Math.sqrt(link.value) * 0.3;
    });
    
    Graph.linkDirectionalParticles(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return (matchingNodeIds.includes(sourceId) && matchingNodeIds.includes(targetId)) ? 6 : 0;
    });
} 