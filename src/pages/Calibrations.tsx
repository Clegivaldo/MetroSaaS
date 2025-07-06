import React, { useState, useEffect } from 'react';
import { Plus, Search, Calculator, Save, Signature } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface Calibration {
  id: string;
  equipment_name: string;
  client_name: string;
  technician_name: string;
  status: string;
  created_at: string;
}

interface MeasurementPoint {
  reference_value: number;
  measured_value: number;
  uncertainty: number;
  deviation: number;
}

export function Calibrations() {
  const [calibrations, setCalibrations] = useState<Calibration[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [standards, setStandards] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([]);
  const [environmentalConditions, setEnvironmentalConditions] = useState({
    temperature: '',
    humidity: '',
    pressure: ''
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchCalibrations();
    fetchEquipment();
    fetchStandards();
  }, []);

  const fetchCalibrations = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/calibrations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCalibrations(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar calibrações');
    }
  };

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/client-equipment', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos');
    }
  };

  const fetchStandards = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/standards', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStandards(data);
      }
    } catch (error) {
      console.error('Erro ao carregar padrões');
    }
  };

  const addMeasurementPoint = () => {
    setMeasurementPoints([...measurementPoints, {
      reference_value: 0,
      measured_value: 0,
      uncertainty: 0,
      deviation: 0
    }]);
  };

  const updateMeasurementPoint = (index: number, field: keyof MeasurementPoint, value: number) => {
    const newPoints = [...measurementPoints];
    newPoints[index][field] = value;
    
    // Calcular desvio automaticamente
    if (field === 'reference_value' || field === 'measured_value') {
      newPoints[index].deviation = newPoints[index].measured_value - newPoints[index].reference_value;
    }
    
    setMeasurementPoints(newPoints);
  };

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/calibrations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...data,
          measurement_points: measurementPoints,
          environmental_conditions: environmentalConditions
        }),
      });

      if (response.ok) {
        toast.success('Calibração criada!');
        setShowModal(false);
        reset();
        setMeasurementPoints([]);
        fetchCalibrations();
      }
    } catch (error) {
      toast.error('Erro ao criar calibração');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calibrações</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Calibração</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipamento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {calibrations.map((calibration) => (
              <tr key={calibration.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{calibration.equipment_name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{calibration.client_name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{calibration.technician_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    calibration.status === 'assinada' ? 'bg-green-100 text-green-800' :
                    calibration.status === 'em_andamento' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {calibration.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(calibration.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Nova Calibração */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">Nova Calibração</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Equipamento *</label>
                    <select {...register('equipment_id')} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Selecione</option>
                      {equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.name} - {eq.client_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Padrões Utilizados</label>
                    <select {...register('standards_used')} multiple className="w-full px-3 py-2 border rounded-lg">
                      {standards.map(std => (
                        <option key={std.id} value={std.id}>{std.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Condições Ambientais */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Condições Ambientais</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Temperatura (°C)</label>
                      <input
                        type="number"
                        value={environmentalConditions.temperature}
                        onChange={(e) => setEnvironmentalConditions({
                          ...environmentalConditions,
                          temperature: e.target.value
                        })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Umidade (%)</label>
                      <input
                        type="number"
                        value={environmentalConditions.humidity}
                        onChange={(e) => setEnvironmentalConditions({
                          ...environmentalConditions,
                          humidity: e.target.value
                        })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Pressão (hPa)</label>
                      <input
                        type="number"
                        value={environmentalConditions.pressure}
                        onChange={(e) => setEnvironmentalConditions({
                          ...environmentalConditions,
                          pressure: e.target.value
                        })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Pontos de Medição */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Pontos de Medição</h3>
                    <button
                      type="button"
                      onClick={addMeasurementPoint}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      + Adicionar Ponto
                    </button>
                  </div>

                  {measurementPoints.map((point, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 mb-3 p-3 bg-gray-50 rounded">
                      <div>
                        <label className="block text-xs font-medium mb-1">Valor Referência</label>
                        <input
                          type="number"
                          step="0.001"
                          value={point.reference_value}
                          onChange={(e) => updateMeasurementPoint(index, 'reference_value', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Valor Medido</label>
                        <input
                          type="number"
                          step="0.001"
                          value={point.measured_value}
                          onChange={(e) => updateMeasurementPoint(index, 'measured_value', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Incerteza</label>
                        <input
                          type="number"
                          step="0.001"
                          value={point.uncertainty}
                          onChange={(e) => updateMeasurementPoint(index, 'uncertainty', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Desvio</label>
                        <input
                          type="number"
                          step="0.001"
                          value={point.deviation}
                          readOnly
                          className="w-full px-2 py-1 border rounded text-sm bg-gray-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Observações</label>
                  <textarea
                    {...register('observations')}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Calibração</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}