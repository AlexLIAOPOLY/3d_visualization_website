// UI Translations for Lithography APP System
const translations = {
    en: {
        title: "Lithography APP System Components",
        resetView: "Reset View",
        showAll: "Show All",
        core: "Core Applications",
        simulation: "Simulation Features",
        analysis: "Analysis Tools",
        service: "Service Features",
        auxiliary: "Auxiliary Tools",
        ai: "AI Tools",
        interactiveEditor: "Interactive 3D Editor",
        ccCurve: "CC Curve Converter",
        heightFile: "Height File Converter",
        customerService: "Customer Service System",
        cc3Tool: "CC3 Curve Comparison Tool",
        visualization3d: "3D Visualization",
        allCategories: "All Categories",
        applications: "Applications",
        modules: "Modules",
        tools: "Tools",
        services: "Services",
        aiComponents: "AI Components",
        dataComponents: "Data Components",
        libraries: "Libraries",
        interfaces: "Interfaces",
        hardware: "Hardware",
        showLabels: "Show Labels",
        zoomIn: "Zoom In",
        zoomOut: "Zoom Out",
        view3d: "3D View",
        view2d: "2D View",
        showLegend: "Show Legend",
        hideLegend: "Hide Legend",
        componentLegend: "Component Legend",
        byGroup: "By Group:",
        byCategory: "By Category:",
        tips: "Tips:",
        clickNodes: "Click on nodes to see details",
        useFilters: "Use filters to focus on specific components",
        useZoom: "Use zoom buttons to adjust view",
        keyboardShortcuts: "Keyboard Shortcuts:",
        switchViews: "2/3: Switch views",
        zoomInOut: "+/-: Zoom in/out",
        resetViewShortcut: "R: Reset view",
        toggleLegend: "L: Toggle legend",
        nodeDetails: "Node Details",
        allNodeSizes: "All Node Sizes",
        largeNodes: "Large (Core Components)",
        mediumNodes: "Medium (Key Features)",
        smallNodes: "Small (Supporting Components)"
    }
};

// Export translations
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = translations;
} else {
    window.translations = translations;
}

// Function to apply translations
function applyTranslations(lang = 'en') {
    const t = translations[lang] || translations['en'];
    
    // Update page title
    document.querySelector('.title').textContent = t.title;
    
    // Update control elements
    document.getElementById('reset-camera').textContent = t.resetView;
    document.querySelector('label[for="show-labels"]').innerHTML = `<input type="checkbox" id="show-labels" checked> ${t.showLabels}`;
    document.getElementById('view-3d').textContent = t.view3d;
    document.getElementById('view-2d').textContent = t.view2d;
    
    // Update dropdowns
    updateDropdown('highlight-group', [
        { value: '', text: t.showAll },
        { value: 'interactive_3d_editor', text: t.interactiveEditor },
        { value: 'cc_curve', text: t.ccCurve },
        { value: 'height_file', text: t.heightFile },
        { value: 'customer_service', text: t.customerService },
        { value: 'cc3_curve', text: t.cc3Tool },
        { value: '3d_visualization', text: t.visualization3d }
    ]);
    
    updateDropdown('filter-category', [
        { value: '', text: t.allCategories },
        { value: 'application', text: t.applications },
        { value: 'module', text: t.modules },
        { value: 'tool', text: t.tools },
        { value: 'service', text: t.services },
        { value: 'ai', text: t.aiComponents },
        { value: 'data', text: t.dataComponents },
        { value: 'library', text: t.libraries },
        { value: 'interface', text: t.interfaces },
        { value: 'hardware', text: t.hardware }
    ]);
    
    updateDropdown('node-size', [
        { value: '', text: t.allNodeSizes },
        { value: 'large', text: t.largeNodes },
        { value: 'medium', text: t.mediumNodes },
        { value: 'small', text: t.smallNodes }
    ]);
    
    // Update legend panel
    document.querySelector('#legend-panel h4').textContent = t.componentLegend;
    
    // Update legend text
    const legendGroupTitle = document.querySelector('#legend-panel .legend-section > div:first-child');
    legendGroupTitle.textContent = t.byGroup;
    
    // Update legend categories
    const legendCategories = document.querySelectorAll('#legend-panel .legend-category span');
    const categoryTexts = [
        t.interactiveEditor, 
        t.ccCurve, 
        t.heightFile, 
        t.customerService, 
        t.cc3Tool, 
        t.visualization3d
    ];
    
    legendCategories.forEach((category, index) => {
        if (index < categoryTexts.length) {
            category.textContent = categoryTexts[index];
        }
    });
    
    // Update tips section
    const tipsTitle = document.querySelector('#legend-panel .legend-section:last-child > div:first-child');
    tipsTitle.textContent = t.tips;
    
    const tipsList = document.querySelectorAll('#legend-panel .legend-section:last-child > div');
    tipsList[1].textContent = '• ' + t.clickNodes;
    tipsList[2].textContent = '• ' + t.useFilters;
    tipsList[3].textContent = '• ' + t.useZoom;
    
    const shortcutsTitle = document.querySelector('#legend-panel .legend-section:last-child > div:nth-child(5)');
    shortcutsTitle.textContent = t.keyboardShortcuts;
    
    const shortcutsList = document.querySelectorAll('#legend-panel .legend-section:last-child > div:nth-child(n+6)');
    shortcutsList[0].textContent = '• ' + t.switchViews;
    shortcutsList[1].textContent = '• ' + t.zoomInOut;
    shortcutsList[2].textContent = '• ' + t.resetViewShortcut;
    shortcutsList[3].textContent = '• ' + t.toggleLegend;
    
    // Update toggle legend button
    const legendButton = document.getElementById('toggle-legend');
    legendButton.textContent = legendButton.textContent === 'Show Legend' ? t.showLegend : t.hideLegend;
    
    // Update node details card - 注释掉可能导致错误的代码
    // document.getElementById('details-card-title').textContent = t.nodeDetails;
}

// Helper function to update dropdown options
function updateDropdown(id, options) {
    const dropdown = document.getElementById(id);
    if (!dropdown) {
        console.warn(`Element with ID '${id}' not found. Dropdown update skipped.`);
        return;
    }
    
    // Clear existing options
    dropdown.innerHTML = '';
    
    // Add new options
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        dropdown.appendChild(optionElement);
    });
}

// Apply translations on load
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations('en');
}); 