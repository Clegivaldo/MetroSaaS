import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Move, Type, Image, Table } from 'lucide-react';
import toast from 'react-hot-toast';

interface LayoutElement {
  id: string;
  type: 'text' | 'image' | 'table' | 'signature';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style?: any;
}

interface Layout {
  id?: string;
  name: string;
  type: string;
  elements: LayoutElement[];
}

export function LayoutDesigner() {
  const [layout, setLayout] = useState<Layout>({
    name: '',
    type: 'certificate',
    elements: []
  });
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);

  const addElement = (type: LayoutElement['type']) => {
    const newElement: LayoutElement = {
      id: Date.now().toString(),
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : type === 'signature' ? 150 : 300,
      height: type === 'text' ? 30 : type === 'signature' ? 80 : 200,
      content: type === 'text' ? 'Texto exemplo' : '',
      style: {
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#000000',
        backgroundColor: 'transparent'
      }
    };

    setLayout(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
  };

  const updateElement = (id: string, updates: Partial<LayoutElement>) => {
    setLayout(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    }));
  };

  const deleteElement = (id: string) => {
    setLayout(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }));
    setSelectedElement(null);
  };

  const saveLayout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/layouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: layout.name,
          type: layout.type,
          design_data: layout.elements
        })
      });

      if (response.ok) {
        toast.success('Layout salvo com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao salvar layout');
    }
  };

  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedElement(elementId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateElement(draggedElement, { x, y });
    setDraggedElement(null);
  };

  const selectedEl = layout.elements.find(el => el.id === selectedElement);

  return (
    <div className="h-screen flex">
      {/* Toolbar */}
      <div className="w-64 bg-white border-r p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Layout</label>
          <input
            type="text"
            value={layout.name}
            onChange={(e) => setLayout(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Nome do layout"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tipo</label>
          <select
            value={layout.type}
            onChange={(e) => setLayout(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="certificate">Certificado</option>
            <option value="contract">Contrato</option>
            <option value="report">Relatório</option>
          </select>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Elementos</h3>
          <div className="space-y-2">
            <button
              onClick={() => addElement('text')}
              className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded"
            >
              <Type className="w-4 h-4" />
              <span>Texto</span>
            </button>
            <button
              onClick={() => addElement('image')}
              className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded"
            >
              <Image className="w-4 h-4" />
              <span>Imagem</span>
            </button>
            <button
              onClick={() => addElement('table')}
              className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded"
            >
              <Table className="w-4 h-4" />
              <span>Tabela</span>
            </button>
            <button
              onClick={() => addElement('signature')}
              className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded"
            >
              <Move className="w-4 h-4" />
              <span>Assinatura</span>
            </button>
          </div>
        </div>

        {selectedEl && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Propriedades</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Largura</label>
                <input
                  type="number"
                  value={selectedEl.width}
                  onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Altura</label>
                <input
                  type="number"
                  value={selectedEl.height}
                  onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              {selectedEl.type === 'text' && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">Conteúdo</label>
                    <textarea
                      value={selectedEl.content}
                      onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Tamanho da Fonte</label>
                    <input
                      type="number"
                      value={selectedEl.style?.fontSize || 14}
                      onChange={(e) => updateElement(selectedEl.id, { 
                        style: { ...selectedEl.style, fontSize: parseInt(e.target.value) }
                      })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </>
              )}
              <button
                onClick={() => deleteElement(selectedEl.id)}
                className="w-full flex items-center justify-center space-x-2 p-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={saveLayout}
          className="w-full flex items-center justify-center space-x-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Layout</span>
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gray-100 p-4">
        <div
          className="bg-white shadow-lg mx-auto"
          style={{ width: '794px', height: '1123px', position: 'relative' }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {layout.elements.map((element) => (
            <div
              key={element.id}
              draggable
              onDragStart={(e) => handleDragStart(e, element.id)}
              onClick={() => setSelectedElement(element.id)}
              className={`absolute border cursor-move ${
                selectedElement === element.id ? 'border-blue-500 border-2' : 'border-gray-300'
              }`}
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                fontSize: element.style?.fontSize,
                fontFamily: element.style?.fontFamily,
                color: element.style?.color,
                backgroundColor: element.style?.backgroundColor
              }}
            >
              {element.type === 'text' && (
                <div className="p-2 h-full overflow-hidden">
                  {element.content}
                </div>
              )}
              {element.type === 'image' && (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <Image className="w-8 h-8" />
                </div>
              )}
              {element.type === 'table' && (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-500">
                  <Table className="w-8 h-8" />
                </div>
              )}
              {element.type === 'signature' && (
                <div className="w-full h-full border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500">
                  Assinatura
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}