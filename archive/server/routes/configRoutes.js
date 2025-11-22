import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, ArrowRight, Plus, Loader2, Car } from 'lucide-react';
import { configAPI } from '../services/api';

const VEHICLE_IMAGES = {
  'model-y': '/assets/hero.mp4', // We'll use a static image fallback in the img tag
  'model-s': '/assets/model-s.jpg',
  'cybertruck': '/assets/cybertruck.jpg',
  'solar': '/assets/solar.jpg'
};

const MyConfigurations = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await configAPI.getAllConfigs();
      if (res.success && res.data && res.data.configurations) {
        setConfigs(res.data.configurations);
      } else {
        setError('Failed to load configurations');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;

    try {
      const res = await configAPI.deleteConfig(vehicleId);
      if (res.success) {
        // Optimistic update: remove from list immediately
        setConfigs(configs.filter(c => c.vehicleId !== vehicleId));
      } else {
        alert('Failed to delete configuration');
      }
    } catch (err) {
      alert('Error deleting configuration');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4 sm:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Configurations</h1>
          <button onClick={() => navigate('/')} className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
            Back to Home <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {configs.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No saved configurations yet</h2>
            <p className="text-gray-500 mb-8">Start designing your dream Tesla today.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Start Configuring
            </button>
          </div>
        ) : (
          // Grid Layout
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition group">
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {/* Image Overlay based on paint selection */}
                  <div className="absolute inset-0 opacity-20" style={{ backgroundColor: item.config.paint || 'transparent' }} />
                  <img 
                    src={VEHICLE_IMAGES[item.vehicleId] || '/assets/model-s.jpg'} 
                    alt={item.vehicleId}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => e.target.src = '/assets/model-s.jpg'}
                  />
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold capitalize text-slate-900">{item.vehicleId.replace('-', ' ')}</h3>
                      <p className="text-xs text-gray-500 mt-1">Modified: {new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                    {/* Simple Color Dot */}
                    <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: item.config.paint }} title="Selected Paint"></div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600 border-b pb-2">
                       <span>Wheels</span>
                       <span className="capitalize font-medium">{item.config.wheels}</span>
                    </div>
                     <div className="flex justify-between text-sm text-gray-600 border-b pb-2">
                       <span>Interior</span>
                       <span className="capitalize font-medium">{item.config.interior}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button 
                      onClick={() => navigate(`/customize/${item.vehicleId}`)}
                      className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(item.vehicleId)}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 transition"
                      title="Delete Configuration"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyConfigurations;