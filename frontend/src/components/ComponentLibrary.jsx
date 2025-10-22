import React from 'react';
// @ts-ignore
// If you want type hints, use JSDoc typedefs above.
import ComponentPreview from './ComponentPreview';

const COMPONENT_CATEGORIES = [
    {
        name: 'Controls',
        items: [
            { name: 'Knob', type: 'knob' },
            { name: 'Slider', type: 'slider' },
            { name: 'Toggle Switch', type: 'switch-toggle' },
            { name: 'Push Button', type: 'button-push' },
            { name: 'Rotary Encoder', type: 'rotary-encoder' },
        ]
    },
    {
        name: 'Displays',
        items: [
            { name: 'Analog VU Meter', type: 'vu-meter-analog' },
            { name: 'Digital VU Meter', type: 'vumeter' },
            { name: '7-Segment Display', type: 'display-7-segment' },
            { name: 'Display Screen', type: 'displayscreen' },
        ]
    },
    {
        name: 'Interaction',
        items: [
            { name: 'Keyboard', type: 'keyboard' },
            { name: 'Pitch Wheel', type: 'pitchwheel' },
            { name: 'Mod Wheel', type: 'modwheel' },
            { name: 'T-Bar Fader', type: 'tbar-fader' },
        ]
    },
     {
        name: 'Decorative',
        items: [
            { name: 'Styled Text', type: 'deco-text' },
            { name: 'Ventilation', type: 'deco-vent' },
            { name: 'Screw', type: 'deco-screw' },
            { name: 'Divider Line', type: 'deco-line' },
        ]
    },
    {
        name: 'Static',
        items: [
            { name: 'Label', type: 'label' },
            { name: 'Image', type: 'image' },
        ]
    }
];

export const ComponentLibrary = () => {
    const handleDragStart = (e, type) => {
        e.dataTransfer.setData('componenttype', type);
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xs uppercase text-[var(--color-text-label)] tracking-wider mb-2">Component Library</h3>
            <div className="flex-1 space-y-1 overflow-y-auto">
                {COMPONENT_CATEGORIES.map(category => (
                    <details key={category.name} open={category.name === 'Controls'} className="bg-black/20 rounded-lg group">
                        <summary className="text-sm font-bold text-gray-300 list-none cursor-pointer p-2 flex items-center gap-2 hover:bg-white/5">
                            <svg className="w-4 h-4 transition-transform duration-200 group-open:rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                            {category.name}
                        </summary>
                        <div className="grid grid-cols-2 gap-2 p-2 border-t border-black/50">
                            {category.items.map(item => (
                                <div
                                    key={item.type}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item.type)}
                                    className="p-2 border border-transparent rounded-lg text-center cursor-grab active:cursor-grabbing hover:border-[var(--color-accent)] hover:bg-black/20 transition-colors"
                                >
                                    <div className="h-16 w-full flex items-center justify-center pointer-events-none">
                                        <ComponentPreview type={item.type} styleId="default" />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{item.name}</p>
                                </div>
                            ))}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
};
