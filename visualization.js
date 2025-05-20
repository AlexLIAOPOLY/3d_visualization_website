// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const graphElement = document.getElementById('3d-graph');
    const graph2dElement = document.getElementById('2d-graph');
    const resetCameraButton = document.getElementById('reset-camera');
    const showLabelsCheckbox = document.getElementById('show-labels');
    const view3dButton = document.getElementById('view-3d');
    const view2dButton = document.getElementById('view-2d');
    const legendPanel = document.getElementById('legend-panel');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const toggleLegendButton = document.getElementById('toggle-legend');
    const nodeTooltip3DDynamic = document.getElementById('node-tooltip-3d-dynamic'); // Get the new tooltip element
    
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
    
    // Color maps for sphere sizes and node types
    const sphereSizeColorMap = {
        'large': '#ff6b00',  // Orange
        'medium': '#0072ce', // Blue
        'small': '#71cb2d'   // Green
    };
    
    const nodeColorMap = {
        'simulation': '#ff5722',      // Simulation - Reddish-orange
        'analysis': '#2196f3',        // Analysis - Blue 
        'service': '#4caf50',         // Service - Green
        'auxiliary': '#ff9800',       // Auxiliary - Orange
        'ai': '#9c27b0',              // AI - Purple
        'core': '#03a9f4'             // Core - Light blue
    };
    
    // Color map for sphere types - 添加类型颜色映射
    const sphereTypeColorMap = {
        'simulation': '#ff5722',       // 仿真 - 红橙色
        'opc': '#2196f3',              // OPC示例 - 蓝色
        'coordinates': '#9c27b0',      // 坐标生成 - 紫色
        'app_service': '#4caf50',      // APP客户端服务 - 绿色
        'cc_optimization': '#ff9800',  // CC曲线优化 - 橙色
        'tools': '#03a9f4'             // 工具组件 - 浅蓝色
    };
    
    // 定义用于高亮节点和链接的集合
    const highlightNodes = new Set();
    const highlightLinks = new Set();
    
    // Initialize 3D force-directed graph
    const Graph3D = ForceGraph3D()
        (graphElement)
        .graphData(graphData)
        .backgroundColor('#ffffff')
        .nodeLabel(node => `${node.name}`)
        .nodeColor(node => sphereSizeColorMap[node.sphereSize])
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
            // 仅设置鼠标样式，不修改节点颜色
            graphElement.style.cursor = node ? 'pointer' : null;
            
            // Show hover tooltip
            if (node) {
                // Calculate tooltip position based on screen coordinates
                const nodePosition = node.__threeObj.position;
                const vector = new THREE.Vector3(nodePosition.x, nodePosition.y, nodePosition.z);
                
                // Project 3D position to screen coordinates
                const canvas = Graph3D.renderer().domElement;
                vector.project(Graph3D.camera());
                
                const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
                const y = (-vector.y * 0.5 + 0.5) * canvas.clientHeight;
                
                // Update and show the tooltip
                nodeTooltip3DDynamic.innerHTML = `<strong>${node.name}</strong>`;
                nodeTooltip3DDynamic.style.left = `${x + 20}px`;
                nodeTooltip3DDynamic.style.top = `${y - 40}px`;
                nodeTooltip3DDynamic.style.display = 'block';

            } else {
                // Hide tooltip
                nodeTooltip3DDynamic.style.display = 'none';
            }
        })
        .onLinkHover(link => {
            graphElement.style.cursor = link ? 'pointer' : null;
            
            // Show link hover tooltip
            if (link) {
                // Remove old tooltip
                const oldTooltip = document.getElementById('link-tooltip-3d');
                if (oldTooltip) oldTooltip.remove();
                
                // Calculate midpoint between source and target nodes
                const sourcePos = link.source.__threeObj.position;
                const targetPos = link.target.__threeObj.position;
                
                // Calculate midpoint
                const midPoint = new THREE.Vector3(
                    (sourcePos.x + targetPos.x) / 2,
                    (sourcePos.y + targetPos.y) / 2,
                    (sourcePos.z + targetPos.z) / 2
                );
                
                // Project 3D position to screen coordinates
                const canvas = Graph3D.renderer().domElement;
                midPoint.project(Graph3D.camera());
                
                const x = (midPoint.x * 0.5 + 0.5) * canvas.clientWidth;
                const y = (-midPoint.y * 0.5 + 0.5) * canvas.clientHeight;
                
                // Create new tooltip
                const tooltip = document.createElement('div');
                tooltip.id = 'link-tooltip-3d';
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
                tooltip.innerHTML = `${link.source.name} → ${link.target.name}${link.description ? '<br>' + link.description : ''}`;
                
                document.body.appendChild(tooltip);
            } else {
                // Remove tooltip
                const tooltip = document.getElementById('link-tooltip-3d');
                if (tooltip) tooltip.remove();
            }
        });
    
    // Initialize 2D force-directed graph
    const Graph2D = ForceGraph()
        (graph2dElement)
        .graphData(graphData)
        .backgroundColor('#f8f8f8') // Lighter background for better contrast
        .nodeId('id')
        .nodeLabel(node => `${node.name}`)
        .nodeColor(node => sphereTypeColorMap[node.sphereType])
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
            ctx.fillStyle = sphereSizeColorMap[node.sphereSize];
            ctx.fill();
            
            // Add node border for better visual effect
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw the "By Type" indicator circle
            const indicatorRadius = 4;
            const angle = -Math.PI / 4; // Top-right position (45 degrees from x-axis, clockwise due to canvas y-down)
            const indicatorX = node.x + (size - indicatorRadius / 2) * Math.cos(angle);
            const indicatorY = node.y + (size - indicatorRadius / 2) * Math.sin(angle);
            const typeColor = sphereTypeColorMap[node.sphereType] || '#808080'; // Default to gray if type undefined

            ctx.beginPath();
            ctx.arc(indicatorX, indicatorY, indicatorRadius, 0, 2 * Math.PI);
            ctx.fillStyle = typeColor;
            ctx.fill();

            // Optional: Add a border to the indicator
            ctx.strokeStyle = '#FFFFFF'; // White border
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw node label if enabled
            if (showLabelsCheckbox.checked) {
                // Define target apparent screen font sizes (these are desired sizes on screen)
                let targetApparentFontSize;
                if (node.sphereSize === 'large') {
                    targetApparentFontSize = 10; // Adjusted from 14
                } else if (node.sphereSize === 'medium') {
                    targetApparentFontSize = 9;  // Adjusted from 13
                } else {
                    targetApparentFontSize = 8;   // Adjusted from 12
                }

                // Calculate the font size to set in ctx.font (this will be in graph units)
                const fontSize = targetApparentFontSize / globalScale;

                // Only draw labels if the graph is zoomed in enough for them to be legible
                // And if the calculated font size is not extremely small (e.g., less than 1 graph unit)
                if (globalScale > 0.25 && fontSize > 1) { // Adjust 0.25 threshold as needed
                    ctx.font = `bold ${fontSize}px Sans-Serif`; 
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Create more compact label
                    const textWidth = ctx.measureText(node.name).width;
                    const bgPadding = 4 / globalScale; // Scale padding inversely with zoom too
                    
                    const labelHeight = fontSize + bgPadding * 2;
                    const labelWidth = textWidth + bgPadding * 2;
                    const labelX = node.x - labelWidth / 2;
                    const labelY = node.y + size + (2 / globalScale); // Scale offset for label from node
                    
                    // Create rounded rectangle background
                    ctx.beginPath();
                    const radius = 4 / globalScale; // Scale corner radius
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
                    ctx.shadowBlur = 4 / globalScale; // Scale shadow blur
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    
                    // Fill label background color with semi-transparent color
                    const sizeColor = sphereSizeColorMap[node.sphereSize];
                    let r = parseInt(sizeColor.slice(1, 3), 16);
                    let g = parseInt(sizeColor.slice(3, 5), 16);
                    let b = parseInt(sizeColor.slice(5, 7), 16);
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
                    ctx.fill();
                    
                    // Draw label text
                    ctx.shadowColor = 'transparent'; // Remove text shadow for text itself
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(node.name, node.x, labelY + labelHeight / 2);
                    
                    // Add special indicator for large spheres (border on the label background)
                    if (node.sphereSize === 'large') {
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5 / globalScale; // Scale border width
                        ctx.stroke();
                    }
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
                tooltip.innerHTML = `<strong>${node.name}</strong>`;
                
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
    
    // Set onClick handlers for both graphs
    Graph3D.onNodeClick(node => {
        handleNodeClick(node, Graph3D);
    });
    
    Graph2D.onNodeClick(node => {
        handleNodeClick(node, Graph2D);
    });
    
    // Set camera position for better initial view
    Graph3D.cameraPosition({ x: 30, y: 30, z: 200 });
    
    // Keep a reference to original nodes for filtering
    const allNodes = JSON.parse(JSON.stringify(graphData.nodes));
    const allLinks = JSON.parse(JSON.stringify(graphData.links));
    
    // Apply filters when selection changes
    // sphereSizeFilterSelect.addEventListener('change', applyFilters);
    // sphereTypeFilterSelect.addEventListener('change', applyFilters);

    // 确保初始化完成后应用一次过滤器
    console.log("页面加载完成，准备应用初始过滤器");
    // 延迟一点应用过滤器，确保图形已经完全初始化
    setTimeout(() => {
        applyFilters();
    }, 1000);
    
    // Apply filters based on current select values
    function applyFilters() {
        const sphereSizeValue = ''; // Default to all sizes
        const sphereTypeValue = ''; // Default to all types
        
        console.log("应用过滤条件:", "尺寸=", sphereSizeValue, "类型=", sphereTypeValue);
        
        if (viewMode === '3d') {
            filterGraph3D(Graph3D, sphereSizeValue, sphereTypeValue);
        } else {
            filterGraph2D(Graph2D, sphereSizeValue, sphereTypeValue);
        }
    }
    
    // Show/hide labels when checkbox changes
    showLabelsCheckbox.addEventListener('change', e => {
        if (viewMode === '2d') {
            // Update 2D view to show labels if checked
            Graph2D.refresh();
        } else {
            // Update 3D view to show labels if checked
            Graph3D.nodeThreeObject(node => {
                if (!e.target.checked) return null; // No labels
                
                // Create text sprite
                const sprite = new SpriteText(node.name);
                sprite.color = '#ffffff';
                sprite.backgroundColor = nodeColorMap[node.group];
                sprite.padding = 2;
                sprite.textHeight = (node.sphereSize === 'large') ? 8 : (node.sphereSize === 'medium' ? 6 : 5);
                sprite.position.y = (node.sphereSize === 'large') ? -13 : (node.sphereSize === 'medium' ? -10 : -8);
                return sprite;
            });
        }
    });
    
    // Set up 3D/2D view switching
    view3dButton.addEventListener('click', () => {
        if (viewMode !== '3d') {
            // Switch to 3D view
            document.getElementById('3d-graph').style.display = 'block';
            document.getElementById('2d-graph').style.display = 'none';
            view3dButton.classList.add('active');
            view2dButton.classList.remove('active');
            viewMode = '3d';
            
            // Apply current filters to 3D view
            applyFilters();
            
            // Apply label setting
            const showLabels = showLabelsCheckbox.checked;
            Graph3D.nodeThreeObject(node => {
                if (!showLabels) return null; // No labels
                
                // Create text sprite
                const sprite = new SpriteText(node.name);
                sprite.color = '#ffffff';
                sprite.backgroundColor = sphereSizeColorMap[node.sphereSize];
                sprite.padding = 2;
                sprite.textHeight = (node.sphereSize === 'large') ? 8 : (node.sphereSize === 'medium' ? 6 : 5);
                sprite.position.y = (node.sphereSize === 'large') ? -13 : (node.sphereSize === 'medium' ? -10 : -8);
                return sprite;
            });
        }
    });
    
    view2dButton.addEventListener('click', () => {
        if (viewMode !== '2d') {
            // Switch to 2D view
            document.getElementById('2d-graph').style.display = 'block';
            document.getElementById('3d-graph').style.display = 'none';
            view2dButton.classList.add('active');
            view3dButton.classList.remove('active');
            viewMode = '2d';
            
            // Apply current filters to 2D view
            applyFilters();
            
            // Fit graph to viewport
            setTimeout(() => {
                Graph2D.zoomToFit(400, 50);
            }, 500);
        }
    });
    
    // Set up reset camera button
    resetCameraButton.addEventListener('click', () => {
        if (viewMode === '3d') {
            // Reset 3D camera position
            Graph3D.cameraPosition({ x: 30, y: 30, z: 200 }, // New position
            Graph3D.scene().position, // Look-at position (center of the graph)
            3000 // Animation duration
            );
            
            // Reset zoom level
            zoom3DLevel = 1.0;
        } else {
            // Reset 2D view
            Graph2D.zoomToFit(400, 50);
            zoom2DLevel = 1.0;
        }
    });
    
    // Set up zoom buttons
    zoomInButton.addEventListener('click', () => {
        if (viewMode === '3d') {
            if (zoom3DLevel < maxZoom) {
                zoom3DLevel += zoomStep;
                const distance = Graph3D.cameraPosition().z;
                Graph3D.cameraPosition({ z: distance * (1 - zoomStep) }, // Move camera closer
                null, // Keep look-at position
                300 // Animation duration
                );
            }
        } else {
            if (zoom2DLevel < maxZoom) {
                zoom2DLevel += zoomStep;
                Graph2D.zoom(zoom2DLevel, 300); // Smooth zoom animation
            }
        }
    });
    
    zoomOutButton.addEventListener('click', () => {
        if (viewMode === '3d') {
            if (zoom3DLevel > minZoom) {
                zoom3DLevel -= zoomStep;
                const distance = Graph3D.cameraPosition().z;
                Graph3D.cameraPosition({ z: distance * (1 + zoomStep) }, // Move camera further
                null, // Keep look-at position
                300 // Animation duration
                );
            }
        } else {
            if (zoom2DLevel > minZoom) {
                zoom2DLevel -= zoomStep;
                Graph2D.zoom(zoom2DLevel, 300); // Smooth zoom animation
            }
        }
    });
    
    // Calculate bounding sphere of nodes (for camera positioning)
    function getBoundingSphere(nodes) {
        if (!nodes || nodes.length === 0) {
            return { center: { x: 0, y: 0, z: 0 }, radius: 100 };
        }
        
        // Find the center of all nodes
        let center = { x: 0, y: 0, z: 0 };
        nodes.forEach(node => {
            center.x += node.x || 0;
            center.y += node.y || 0;
            center.z += node.z || 0;
        });
        
        center.x /= nodes.length;
        center.y /= nodes.length;
        center.z /= nodes.length;
        
        // Find the maximum distance from center to any node
        let maxDistSq = 0;
        nodes.forEach(node => {
            const dx = (node.x || 0) - center.x;
            const dy = (node.y || 0) - center.y;
            const dz = (node.z || 0) - center.z;
            const distSq = dx*dx + dy*dy + dz*dz;
            maxDistSq = Math.max(maxDistSq, distSq);
        });
        
        return {
            center: center,
            radius: Math.sqrt(maxDistSq) + 50 // Add some padding
        };
    }
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', e => {
        switch (e.key) {
            case '3':
                // Switch to 3D view
                view3dButton.click();
                break;
            case '2':
                // Switch to 2D view
                view2dButton.click();
                break;
            case 'r':
            case 'R':
                // Reset camera
                resetCameraButton.click();
                break;
            case 'l':
            case 'L':
                // Toggle legend
                toggleLegendButton.click();
                break;
            case '+':
                // Zoom in
                zoomInButton.click();
                break;
            case '-':
                // Zoom out
                zoomOutButton.click();
                break;
        }
    });
    
    // Handle node click to show details
    function handleNodeClick(node, graph) {
        // First highlight the node and its connections
        if (viewMode === '3d') {
            highlightNodeAndLinks3D(graph, node);
        } else {
            highlightNodeAndLinks2D(graph, node);
        }
        
        // Then show node details panel
        showNodeDetails(node);
    }

    // 实现高亮节点和连接的函数
    function highlightNodeAndLinks3D(graph, focusNode) {
        // 创建高亮节点和链接的集合
        const highlightedNodes = new Set([focusNode]);
        const highlightedLinks = new Set();
        
        // 查找关联的链接和节点
        graph.graphData().links.forEach(link => {
            if (link.source === focusNode || link.target === focusNode) {
                highlightedLinks.add(link);
                highlightedNodes.add(link.source === focusNode ? link.target : link.source);
            }
        });
        
        // 应用高亮样式
        graph.nodeOpacity(node => {
            if (node.id === 'main_app') return 1;
            return highlightedNodes.has(node) ? 1 : 0.2;
        });
        
        graph.linkOpacity(link => highlightedLinks.has(link) ? 0.8 : 0.1);
        graph.linkWidth(link => highlightedLinks.has(link) ? Math.sqrt(link.value) * 1.5 : Math.sqrt(link.value) * 0.3);
        graph.linkDirectionalParticles(link => highlightedLinks.has(link) ? 6 : 0);
    }

    function highlightNodeAndLinks2D(graph, focusNode) {
        // 创建高亮节点和链接的集合
        const highlightedNodes = new Set([focusNode]);
        const highlightedLinks = new Set();
        
        // 查找关联的链接和节点
        graph.graphData().links.forEach(link => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            const nodeId = focusNode.id;
            
            if (sourceId === nodeId || targetId === nodeId) {
                highlightedLinks.add(link);
                const connectedNode = graph.graphData().nodes.find(n => 
                    n.id === (sourceId === nodeId ? targetId : sourceId)
                );
                if (connectedNode) {
                    highlightedNodes.add(connectedNode);
                }
            }
        });
        
        // 应用高亮样式
        graph.nodeColor(node => {
            if (node.id === 'main_app') return nodeColorMap[node.group];
            return highlightedNodes.has(node) ? nodeColorMap[node.group] : '#dddddd';
        });
        
        graph.linkColor(link => highlightedLinks.has(link) ? '#666666' : '#eeeeee');
        graph.linkWidth(link => highlightedLinks.has(link) ? Math.sqrt(link.value) * 1.5 : Math.sqrt(link.value) * 0.3);
        graph.linkDirectionalParticles(link => highlightedLinks.has(link) ? 6 : 0);
    }
    
    // Set up continuous rotation for 3D view (better visual effect)
    const rotateView = () => {
        if (viewMode === '3d') {
            const rotationSpeed = 0.0005; // Slow rotation
            
            // Get current camera position
            const { x, y, z } = Graph3D.cameraPosition();
            
            // Calculate distance from center
            const r = Math.sqrt(x*x + z*z);
            
            // Calculate current angle
            let theta = Math.atan2(z, x);
            
            // Increment angle
            theta += rotationSpeed;
            
            // Calculate new position
            const newX = r * Math.cos(theta);
            const newZ = r * Math.sin(theta);
            
            // Update camera position
            Graph3D.cameraPosition({ x: newX, z: newZ });
        }
        
        requestAnimationFrame(rotateView);
    };
    
    // Start rotation (comment this line to disable auto-rotation)
    // rotateView();
    
    // Add touch support for mobile
    let touchStartX, touchStartY;
    
    graphElement.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    });
    
    graphElement.addEventListener('touchmove', e => {
        if (viewMode === '3d' && e.touches.length === 1) {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // Update camera position based on touch movement
            const { x, y, z } = Graph3D.cameraPosition();
            const distance = Math.sqrt(x*x + z*z);
            
            // Calculate rotation angles
            const rotationSpeed = 0.01;
            const horizontalAngle = deltaX * rotationSpeed;
            
            // Calculate current angle
            let theta = Math.atan2(z, x);
            
            // Increment angle
            theta += horizontalAngle;
            
            // Calculate new position
            const newX = distance * Math.cos(theta);
            const newZ = distance * Math.sin(theta);
            
            // Update camera position
            Graph3D.cameraPosition({ 
                x: newX, 
                y: y - deltaY * rotationSpeed, 
                z: newZ 
            });
            
            touchStartX = touchX;
            touchStartY = touchY;
        }
    });
    
    // 将 addHoverInteraction 和 addHoverInteraction2D 的调用移到此处
    addHoverInteraction(Graph3D);
    addHoverInteraction2D(Graph2D);
    
    // Initialize with optimized graph relationships
    // optimizeRelationships(); // Commented out to prevent tickFrame error
            
    // For better visualization, organize the relationships
    /* // Commented out to prevent tickFrame error
    function optimizeRelationships() {
        // First apply initial physics simulation for a better spread
        let iterations = 0;
        const simulatePhysics = () => {
            if (iterations < 100) { // Run physics for 100 iterations
                Graph3D.tickFrame();
                iterations++;
                requestAnimationFrame(simulatePhysics);
            }
        };
        
        // Start physics simulation
        simulatePhysics();
    }
    */
    
    // Function to fit 2D graph to visible nodes
    function fitGraph2DToNodes() {
        const visibleNodes = Graph2D.graphData().nodes;
        if (visibleNodes.length === 0) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        visibleNodes.forEach(node => {
            if (node.x < minX) minX = node.x;
            if (node.x > maxX) maxX = node.x;
            if (node.y < minY) minY = node.y;
            if (node.y > maxY) maxY = node.y;
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;
        
        // Calculate zoom level to fit all nodes
        const scale = Math.min(
            (Graph2D.width() * 0.8) / width,
            (Graph2D.height() * 0.8) / height
        );
        
        // Zoom to fit with animation
        Graph2D.centerAt(centerX, centerY, 1000)
            .zoom(scale * 0.9, 1000); // Slight zoom out for margin
    }
            
    // Add tooltip for highlight options
    // sphereSizeFilterSelect.title = "Filter by sphere size (large, medium, small)";
    // sphereTypeFilterSelect.title = "Filter by sphere type (simulation, OPC, etc.)";
    
    // Filter graph based on sphere size and type
    function filterGraph3D(Graph, sphereSizeValue, sphereTypeValue) {
        console.log("执行3D过滤:", "尺寸=", sphereSizeValue, "类型=", sphereTypeValue);
        
        // Instead of removing nodes, we'll highlight matching ones
        if (!sphereSizeValue && !sphereTypeValue) {
            console.log("没有过滤条件，显示全部");
            // Reset all nodes and links to original style if no filter
            Graph.nodeOpacity(1);
            Graph.linkOpacity(0.6);
            Graph.linkWidth(link => Math.sqrt(link.value) * 0.5);
            Graph.linkDirectionalParticles(link => Math.round(link.value / 2));
            
            // Use all data
            Graph.graphData({
                nodes: allNodes,
                links: allLinks
            });
            
            // Apply label setting if enabled
            const showLabels = showLabelsCheckbox.checked;
            if (showLabels) {
                Graph.nodeThreeObject(node => {
                    // Create text sprite
                    const sprite = new SpriteText(node.name);
                    sprite.color = '#ffffff';
                    sprite.backgroundColor = sphereSizeColorMap[node.sphereSize];
                    sprite.padding = 2;
                    sprite.textHeight = (node.sphereSize === 'large') ? 8 : (node.sphereSize === 'medium' ? 6 : 5);
                    sprite.position.y = (node.sphereSize === 'large') ? -13 : (node.sphereSize === 'medium' ? -10 : -8);
                    return sprite;
                });
            } else {
                Graph.nodeThreeObject(null);
            }
            return;
        }
        
        // Identify matching nodes
        const matchingNodes = new Set();
        const matchingLinks = new Set();
        
        // Find matching nodes
        console.log("开始查找符合条件的节点...");
        allNodes.forEach(node => {
            const sizeMatch = !sphereSizeValue || node.sphereSize === sphereSizeValue;
            const typeMatch = !sphereTypeValue || node.sphereType === sphereTypeValue;
            
            if (sizeMatch && typeMatch) {
                matchingNodes.add(node.id);
                console.log("匹配节点:", node.id, node.name, "尺寸:", node.sphereSize, "类型:", node.sphereType);
            }
        });
        console.log(`找到 ${matchingNodes.size} 个匹配节点`);
        
        // Find links between matching nodes
        allLinks.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            if (matchingNodes.has(sourceId) && matchingNodes.has(targetId)) {
                matchingLinks.add(link);
            }
        });
        
        // Use all nodes but highlight matching ones
        Graph.graphData({
            nodes: allNodes,
            links: allLinks
        });
        
        // Highlight matching nodes and links
        Graph.nodeOpacity(node => matchingNodes.has(node.id) ? 1 : 0.2);
        Graph.linkOpacity(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            return (matchingNodes.has(sourceId) && matchingNodes.has(targetId)) ? 0.8 : 0.1;
        });
        
        Graph.linkWidth(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            return (matchingNodes.has(sourceId) && matchingNodes.has(targetId)) 
                ? Math.sqrt(link.value) * 1.5 
                : Math.sqrt(link.value) * 0.3;
        });
        
        Graph.linkDirectionalParticles(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            return (matchingNodes.has(sourceId) && matchingNodes.has(targetId)) ? 6 : 0;
        });
        
        // Apply label setting if enabled
        const showLabels = showLabelsCheckbox.checked;
        if (showLabels) {
            Graph.nodeThreeObject(node => {
                // Only show labels for matching nodes
                if (!matchingNodes.has(node.id) && matchingNodes.size > 0) return null;
        
                // Create text sprite
                const sprite = new SpriteText(node.name);
                sprite.color = '#ffffff';
                sprite.backgroundColor = sphereSizeColorMap[node.sphereSize];
                sprite.padding = 2;
                sprite.textHeight = (node.sphereSize === 'large') ? 8 : (node.sphereSize === 'medium' ? 6 : 5);
                sprite.position.y = (node.sphereSize === 'large') ? -13 : (node.sphereSize === 'medium' ? -10 : -8);
                return sprite;
            });
        } else {
            Graph.nodeThreeObject(null);
        }
    }
    
    function filterGraph2D(Graph, sphereSizeValue, sphereTypeValue) {
        // Instead of removing nodes, we'll highlight matching ones
        if (!sphereSizeValue && !sphereTypeValue) {
            // Reset all nodes and links to original style if no filter
            Graph.nodeColor(node => sphereSizeColorMap[node.sphereSize]);
            Graph.linkColor(() => '#888888');
            Graph.linkWidth(link => Math.sqrt(link.value) * 1);
            Graph.linkDirectionalParticles(link => Math.round(link.value / 2));
            
            // Use all data
            Graph.graphData({
                nodes: allNodes,
                links: allLinks
            });
            
            // Fit graph to viewport
            setTimeout(() => {
                Graph.zoomToFit(400, 50);
            }, 500);
            
            return;
        }
        
        // Identify matching nodes
        const matchingNodes = new Set();
        const matchingLinks = new Set();
        
        // Find matching nodes
        allNodes.forEach(node => {
            const sizeMatch = !sphereSizeValue || node.sphereSize === sphereSizeValue;
            const typeMatch = !sphereTypeValue || node.sphereType === sphereTypeValue;
            
            if (sizeMatch && typeMatch) {
                matchingNodes.add(node.id);
            }
        });
        
        // Find links between matching nodes
        allLinks.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            if (matchingNodes.has(sourceId) && matchingNodes.has(targetId)) {
                matchingLinks.add(link);
            }
        });
        
        // Use all nodes but highlight matching ones
        Graph.graphData({
            nodes: allNodes,
            links: allLinks
        });
        
        // Highlight by node color
        Graph.nodeColor(node => {
            return matchingNodes.has(node.id) ? sphereSizeColorMap[node.sphereSize] : '#dddddd';
        });
        
        // Highlight links
        Graph.linkColor(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            return (matchingNodes.has(sourceId) && matchingNodes.has(targetId)) ? '#666666' : '#eeeeee';
        });
        
        Graph.linkWidth(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            return (matchingNodes.has(sourceId) && matchingNodes.has(targetId)) 
                ? Math.sqrt(link.value) * 1.5 
                : Math.sqrt(link.value) * 0.3;
        });
        
        Graph.linkDirectionalParticles(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            return (matchingNodes.has(sourceId) && matchingNodes.has(targetId)) ? 6 : 0;
        });
        
        // Fit graph to viewport
        setTimeout(() => {
            Graph.zoomToFit(400, 50);
        }, 500);
    }
}); // DOMContentLoaded 监听器结束

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

// 添加链接点击处理函数
function handleLinkClick(link) {
    console.log('Link clicked:', link);
    // 这里可以添加链接点击后的特殊处理逻辑
}

// 设置viewMode全局变量，避免在函数中引用错误
let viewMode = '3d'; 

// Set up continuous rotation for 3D view (better visual effect)
const rotateView = () => {
    if (viewMode === '3d') {
        const rotationSpeed = 0.0005; // Slow rotation
        
        // Get current camera position
        const { x, y, z } = Graph3D.cameraPosition();
        
        // Calculate distance from center
        const r = Math.sqrt(x*x + z*z);
        
        // Calculate current angle
        let theta = Math.atan2(z, x);
        
        // Increment angle
        theta += rotationSpeed;
        
        // Calculate new position
        const newX = r * Math.cos(theta);
        const newZ = r * Math.sin(theta);
        
        // Update camera position
        Graph3D.cameraPosition({ x: newX, z: newZ });
    }
    
    requestAnimationFrame(rotateView);
};

// Start rotation (comment this line to disable auto-rotation)
// rotateView();

// Setup tooltips for nodes
addHoverInteraction(Graph3D);
addHoverInteraction2D(Graph2D);

// Add responsiveness handling for mobile
window.addEventListener('resize', () => {
    // Update graph dimensions
    Graph3D.width(window.innerWidth).height(window.innerHeight);
    Graph2D.width(window.innerWidth).height(window.innerHeight);
    
    if (viewMode === '2d') {
        // Center the 2D graph
        Graph2D.zoomToFit(400, 50);
    }
});

// Add touch support for mobile
let touchStartX, touchStartY;

graphElement.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
});

graphElement.addEventListener('touchmove', e => {
    if (viewMode === '3d' && e.touches.length === 1) {
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;
        
        // Update camera position based on touch movement
        const { x, y, z } = Graph3D.cameraPosition();
        const distance = Math.sqrt(x*x + z*z);
        
        // Calculate rotation angles
        const rotationSpeed = 0.01;
        const horizontalAngle = deltaX * rotationSpeed;
        
        // Calculate current angle
        let theta = Math.atan2(z, x);
        
        // Increment angle
        theta += horizontalAngle;
        
        // Calculate new position
        const newX = distance * Math.cos(theta);
        const newZ = distance * Math.sin(theta);
        
        // Update camera position
        Graph3D.cameraPosition({ 
            x: newX, 
            y: y - deltaY * rotationSpeed, 
            z: newZ 
        });
        
        touchStartX = touchX;
        touchStartY = touchY;
    }
});

// Initialize with optimized graph relationships
// optimizeRelationships(); // Commented out to prevent tickFrame error
            
// For better visualization, organize the relationships
/* // Commented out to prevent tickFrame error
function optimizeRelationships() {
    // First apply initial physics simulation for a better spread
    let iterations = 0;
    const simulatePhysics = () => {
        if (iterations < 100) { // Run physics for 100 iterations
            Graph3D.tickFrame();
            iterations++;
            requestAnimationFrame(simulatePhysics);
        }
    };
    
    // Start physics simulation
    simulatePhysics();
}
*/

// Function to fit 2D graph to visible nodes
function fitGraph2DToNodes() {
    const visibleNodes = Graph2D.graphData().nodes;
    if (visibleNodes.length === 0) return;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    visibleNodes.forEach(node => {
        if (node.x < minX) minX = node.x;
        if (node.x > maxX) maxX = node.x;
        if (node.y < minY) minY = node.y;
        if (node.y > maxY) maxY = node.y;
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;
    
    // Calculate zoom level to fit all nodes
    const scale = Math.min(
        (Graph2D.width() * 0.8) / width,
        (Graph2D.height() * 0.8) / height
    );
    
    // Zoom to fit with animation
    Graph2D.centerAt(centerX, centerY, 1000)
        .zoom(scale * 0.9, 1000); // Slight zoom out for margin
}

// ... existing code ... 