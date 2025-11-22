import React, { useState, useEffect, createContext, useContext } from 'react';
import { Car, Menu, X, User, ShoppingCart, Check, Loader2, Zap, Settings, Gauge } from 'lucide-react';

// ==========================================
// 0. API SERVICE (Real Backend Only - No Mock Fallback)
// ==========================================
const API_BASE = '/api/auth';

// Session storage keys
const SESSION_STORAGE_KEY = 'tesla_user_session';
const SESSION_TIMESTAMP_KEY = 'tesla_session_timestamp';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Helper functions for session storage
const saveSessionToStorage = (userData) => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
};

const getSessionFromStorage = () => {
  try {
    const userData = localStorage.getItem(SESSION_STORAGE_KEY);
    const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
    
    if (!userData || !timestamp) return null;
    
    // Check if session is expired
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > SESSION_MAX_AGE) {
      clearSessionStorage();
      return null;
    }
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('Failed to read session from localStorage:', error);
    return null;
  }
};

const clearSessionStorage = () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Failed to clear session from localStorage:', error);
  }
};

const fetchWithAuth = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // CRITICAL: Allows the session cookie to pass
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Backend unavailable: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return { 
      success: response.ok, 
      data, 
      status: response.status,
      error: response.ok ? null : (data.message || 'Something went wrong')
    };

  } catch (error) {
    console.error(`Backend request failed: ${error.message}`);
    return { 
      success: false, 
      error: 'Unable to connect to server. Please ensure the backend is running.',
      status: 0
    };
  }
};

const authAPI = {
  login: (email, password) => fetchWithAuth('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) => fetchWithAuth('/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  logout: () => fetchWithAuth('/logout', { method: 'POST' }), 
  checkStatus: () => fetchWithAuth('/check', { method: 'GET' }),
};

// ==========================================
// 1. AUTH CONTEXT (State Management)
// ==========================================
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Check Authentication on Mount and Page Refresh
  useEffect(() => {
    const initAuth = async () => {
      // First, check localStorage for cached session
      const cachedUser = getSessionFromStorage();
      if (cachedUser) {
        setUser(cachedUser);
      }
      
      // Then verify with backend
      const result = await authAPI.checkStatus();
      if (result.success && result.data && result.data.isAuthenticated) {
        setUser(result.data.user);
        saveSessionToStorage(result.data.user);
      } else {
        setUser(null);
        clearSessionStorage();
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // 2. Login Action
  const login = async (email, password) => {
    const result = await authAPI.login(email, password);
    if (result.success && result.data && result.data.user) {
      setUser(result.data.user);
      saveSessionToStorage(result.data.user);
      return { success: true };
    }
    
    if (result.status === 404) {
      return { success: false, error: 'Account not found', showSignupPopup: true };
    }
    
    return { success: false, error: result.error || 'Login failed' };
  };

  // 3. Signup Action
  const signup = async (name, email, password) => {
    const result = await authAPI.register(name, email, password);
    if (result.success && result.data && result.data.user) {
      setUser(result.data.user);
      saveSessionToStorage(result.data.user);
      return { success: true };
    }
    return { success: false, error: result.error || 'Signup failed' };
  };

  // 4. Logout Action
  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    clearSessionStorage();
    sessionStorage.removeItem('currentConfig');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// ==========================================
// 2. ENHANCED VEHICLE DATA WITH VIDEOS
// ==========================================
const VEHICLES = {
  model3: { 
    id: 'model3', 
    name: 'Model 3', 
    tagline: 'Lease starting at $329/mo', 
    basePrice: 38990,
    video: 'https://digitalassets.tesla.com/tesla-contents/video/upload/f_auto,q_auto/Homepage-Model-3-Desktop-NA.mp4',
    image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-3-Desktop-LHD.png',
    images: {
      white: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-3-Desktop-LHD.png',
      black: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPSW,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
      blue: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PBSB,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
      red: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPMR,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
      gray: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PMNG,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&'
    },
    specs: { range: '272 mi', topSpeed: '125 mph', acceleration: '5.8s' },
    customization: { 
      battery: [
        {id:'standard', name:'Standard Range', range: '272 mi', topSpeed: '125 mph', acceleration: '5.8s', price: 0},
        {id:'long', name:'Long Range AWD', range: '341 mi', topSpeed: '135 mph', acceleration: '4.2s', price: 7500},
        {id:'performance', name:'Performance', range: '315 mi', topSpeed: '162 mph', acceleration: '3.1s', price: 12500}
      ],
      paint: [
        {id:'white', name: 'Pearl White Multi-Coat', hex:'#f4f6f8', price:0}, 
        {id:'black', name: 'Solid Black', hex:'#171a20', price:1500}, 
        {id:'blue', name: 'Deep Blue Metallic', hex:'#1e3a8a', price:1000},
        {id:'red', name: 'Ultra Red', hex:'#dc2626', price:2000},
        {id:'gray', name: 'Midnight Silver Metallic', hex:'#71717a', price:1000}
      ],
      wheels: [
        {id:'18', name:'18" Aero Wheels', price:0}, 
        {id:'19', name:'19" Sport Wheels', price:1500}
      ],
      interior: [
        {id:'black', name:'All Black', price:0, hex: '#000'}, 
        {id:'white', name:'Black & White', price:1000, hex: '#fff'}
      ],
      autopilot: [
        {id:'basic', name:'Autopilot', features: ['Traffic-Aware Cruise Control', 'Autosteer'], price: 0},
        {id:'enhanced', name:'Enhanced Autopilot', features: ['Navigate on Autopilot', 'Auto Lane Change', 'Autopark', 'Summon'], price: 6000},
        {id:'fsd', name:'Full Self-Driving', features: ['Traffic Light and Stop Sign Control', 'Autosteer on City Streets'], price: 12000}
      ]
    } 
  },
  modelY: { 
    id: 'modelY', 
    name: 'Model Y', 
    tagline: 'Lease starting at $379/mo', 
    basePrice: 44990,
    video: 'https://digitalassets.tesla.com/tesla-contents/video/upload/f_auto,q_auto/Homepage-Model-Y-Desktop-Global.mp4',
    image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/h_1800,w_2880,c_fit,f_auto,q_auto:best/Homepage-Model-Y-Global-Desktop',
    images: {
      white: 'https://digitalassets.tesla.com/tesla-contents/image/upload/h_1800,w_2880,c_fit,f_auto,q_auto:best/Homepage-Model-Y-Global-Desktop',
      black: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPSW,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
      blue: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PBSB,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
      red: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPMR,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
      gray: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PMNG,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&'
    },
    specs: { range: '310 mi', topSpeed: '135 mph', acceleration: '4.8s' },
    customization: { 
      battery: [
        {id:'long', name:'Long Range AWD', range: '330 mi', topSpeed: '135 mph', acceleration: '4.8s', price: 0},
        {id:'performance', name:'Performance', range: '303 mi', topSpeed: '155 mph', acceleration: '3.5s', price: 8000}
      ],
      paint: [
        {id:'white', name: 'Pearl White Multi-Coat', hex:'#f4f6f8', price:0}, 
        {id:'black', name: 'Solid Black', hex:'#171a20', price:1500}, 
        {id:'blue', name: 'Deep Blue Metallic', hex:'#1e3a8a', price:1000},
        {id:'red', name: 'Ultra Red', hex:'#dc2626', price:2000},
        {id:'gray', name: 'Midnight Silver Metallic', hex:'#71717a', price:1000}
      ],
      wheels: [
        {id:'19', name:'19" Gemini Wheels', price:0}, 
        {id:'20', name:'20" Induction Wheels', price:2000}
      ],
      interior: [
        {id:'black', name:'All Black', price:0, hex: '#000'}, 
        {id:'white', name:'Black & White', price:1000, hex: '#fff'}
      ],
      autopilot: [
        {id:'basic', name:'Autopilot', features: ['Traffic-Aware Cruise Control', 'Autosteer'], price: 0},
        {id:'enhanced', name:'Enhanced Autopilot', features: ['Navigate on Autopilot', 'Auto Lane Change', 'Autopark', 'Summon'], price: 6000},
        {id:'fsd', name:'Full Self-Driving', features: ['Traffic Light and Stop Sign Control', 'Autosteer on City Streets'], price: 12000}
      ]
    } 
  },
};

// ==========================================
// 3. UI COMPONENTS
// ==========================================

const Navigation = ({ currentPage, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 hover:bg-white/95 bg-white/80 backdrop-blur-md text-slate-900 shadow-sm">
      <div className="flex justify-between items-center px-6 lg:px-12 py-3">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 z-50">
          <svg className="w-8 h-8" viewBox="0 0 342 35" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 .1a9.7 9.7 0 007 7h11l.5.1v27.6h6.8V7.3L26 7h11a9.8 9.8 0 007-7H0zm238.6 0h-6.8v34.8H263a9.7 9.7 0 006-6.8h-30.3V0zm-52.3 6.8c3.6-1 6.6-3.8 7.4-6.9l-38.1.1v20.6h31.1v7.2h-24.4a13.6 13.6 0 00-8.7 7h39.9v-21h-31.2v-7h24zm116.2 28h6.7v-14h24.6v14h6.7v-21h-38zM85.3 7h26a9.6 9.6 0 007.1-7H78.3a9.6 9.6 0 007 7zm0 13.8h26a9.6 9.6 0 007.1-7H78.3a9.6 9.6 0 007 7zm0 14.1h26a9.6 9.6 0 007.1-7H78.3a9.6 9.6 0 007 7zM308.5 7h26a9.6 9.6 0 007-7h-40a9.6 9.6 0 007 7z" fill="currentColor"/>
          </svg>
        </button>
        
        <div className="hidden lg:flex space-x-6 text-[13px] font-medium">
          {Object.values(VEHICLES).map(v => (
            <button key={v.id} onClick={() => onNavigate('home')} className="hover:bg-black/5 px-3 py-2 rounded transition">
              {v.name}
            </button>
          ))}
          <button className="hover:bg-black/5 px-3 py-2 rounded transition">Solar Roof</button>
          <button className="hover:bg-black/5 px-3 py-2 rounded transition">Solar Panels</button>
          <button className="hover:bg-black/5 px-3 py-2 rounded transition">Powerwall</button>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-[13px] font-medium">
          <button className="hover:bg-black/5 px-3 py-2 rounded transition">Shop</button>
          {user ? (
            <>
              <button onClick={() => onNavigate('account')} className="hover:bg-black/5 px-3 py-2 rounded flex items-center gap-2">
                <User className="w-4 h-4" />
                {user.name || user.email.split('@')[0]}
              </button>
              <button onClick={logout} className="hover:bg-black/5 px-3 py-2 rounded">Logout</button>
            </>
          ) : (
            <button onClick={() => onNavigate('login')} className="hover:bg-black/5 px-3 py-2 rounded">Account</button>
          )}
          <button onClick={() => setMenuOpen(true)} className="hover:bg-black/5 px-3 py-2 rounded">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <button onClick={() => setMenuOpen(true)} className="lg:hidden bg-black/5 px-4 py-2 rounded text-[13px] font-medium">
          Menu
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-8 flex flex-col gap-6 overflow-y-auto shadow-2xl">
            <div className="flex justify-end">
              <button onClick={() => setMenuOpen(false)} className="hover:bg-gray-100 p-2 rounded-full">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {Object.values(VEHICLES).map(v => (
                <button 
                  key={v.id} 
                  onClick={() => {onNavigate('home'); setMenuOpen(false);}} 
                  className="text-left py-3 px-4 hover:bg-gray-100 rounded-lg font-medium text-sm"
                >
                  {v.name}
                </button>
              ))}
              <button className="text-left py-3 px-4 hover:bg-gray-100 rounded-lg font-medium text-sm">Solar Roof</button>
              <button className="text-left py-3 px-4 hover:bg-gray-100 rounded-lg font-medium text-sm">Solar Panels</button>
              <button className="text-left py-3 px-4 hover:bg-gray-100 rounded-lg font-medium text-sm">Powerwall</button>
              {user && (
                <button 
                  onClick={() => { onNavigate('account'); setMenuOpen(false); }} 
                  className="text-left py-3 px-4 hover:bg-gray-100 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  My Account
                </button>
              )}
              <button 
                onClick={() => { 
                  if(!user) onNavigate('login'); 
                  else { logout(); } 
                  setMenuOpen(false); 
                }} 
                className="text-left py-3 px-4 hover:bg-gray-100 rounded-lg font-medium text-sm"
              >
                {user ? 'Logout' : 'Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const HeroSection = ({ vehicle, onSelect }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false);

  return (
    <div className="h-screen w-full relative snap-start overflow-hidden">
      {/* Video Background */}
      {vehicle.video && (
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onLoadedData={() => setMediaLoaded(true)}
        >
          <source src={vehicle.video} type="video/mp4" />
        </video>
      )}
      
      {/* Fallback Image */}
      {!mediaLoaded && (
        <img 
          src={vehicle.image} 
          alt={vehicle.name} 
          className="absolute inset-0 w-full h-full object-cover" 
        />
      )}
      
      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-between py-20 sm:py-28 pointer-events-none">
        <div className="text-center space-y-2 pt-16">
          <h1 className="text-5xl sm:text-6xl font-semibold text-slate-900 tracking-tight">{vehicle.name}</h1>
          <p className="text-base sm:text-lg text-slate-700 font-medium">{vehicle.tagline}</p>
          <div className="flex gap-6 justify-center text-sm font-medium pt-2">
            <div className="text-center">
              <div className="text-2xl font-semibold">{vehicle.specs.range}</div>
              <div className="text-xs text-gray-600">Range (EPA est.)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">{vehicle.specs.topSpeed}</div>
              <div className="text-xs text-gray-600">Top Speed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">{vehicle.specs.acceleration}</div>
              <div className="text-xs text-gray-600">0-60 mph</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-6 pointer-events-auto">
          <button 
            onClick={() => onSelect(vehicle.id)} 
            className="flex-1 bg-slate-900 text-white py-2.5 px-6 rounded font-medium text-sm hover:bg-slate-800 transition-all shadow-lg"
          >
            Custom Order
          </button>
          <button className="flex-1 bg-white text-slate-900 py-2.5 px-6 rounded font-medium text-sm hover:bg-gray-50 transition-all shadow-lg">
            Demo Drive
          </button>
        </div>
      </div>
    </div>
  );
};

const Homepage = ({ onSelectVehicle }) => (
  <div className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
    {Object.values(VEHICLES).map(v => (
      <HeroSection key={v.id} vehicle={v} onSelect={onSelectVehicle} />
    ))}
  </div>
);

// ENHANCED CONFIGURATOR
const Configurator = ({ vehicleId, onBack, onNavigate }) => {
  const vehicle = VEHICLES[vehicleId];
  const { user } = useAuth();
  
  const [config, setConfig] = useState({
    battery: vehicle.customization.battery[0].id,
    paint: vehicle.customization.paint[0].id,
    wheels: vehicle.customization.wheels[0].id,
    interior: vehicle.customization.interior[0].id,
    autopilot: vehicle.customization.autopilot[0].id
  });

  const [currentImage, setCurrentImage] = useState(vehicle.images[vehicle.customization.paint[0].id] || vehicle.image);

  const selectedBattery = vehicle.customization.battery.find(b => b.id === config.battery);
  const selectedPaint = vehicle.customization.paint.find(p => p.id === config.paint);
  const selectedWheels = vehicle.customization.wheels.find(w => w.id === config.wheels);
  const selectedInterior = vehicle.customization.interior.find(i => i.id === config.interior);
  const selectedAutopilot = vehicle.customization.autopilot.find(a => a.id === config.autopilot);

  const totalPrice = vehicle.basePrice + 
    (selectedBattery?.price || 0) + 
    (selectedPaint?.price || 0) + 
    (selectedWheels?.price || 0) + 
    (selectedInterior?.price || 0) + 
    (selectedAutopilot?.price || 0);

  useEffect(() => {
    if (vehicle.images[config.paint]) {
      setCurrentImage(vehicle.images[config.paint]);
    }
  }, [config.paint, vehicle.images]);

  const handleOrder = () => {
    if (!user) {
      alert('Please login to place an order');
      onNavigate('login');
      return;
    }
    
    const orderData = {
      vehicleId,
      vehicleName: vehicle.name,
      config,
      selectedOptions: {
        battery: selectedBattery,
        paint: selectedPaint,
        wheels: selectedWheels,
        interior: selectedInterior,
        autopilot: selectedAutopilot
      },
      totalPrice,
      timestamp: Date.now()
    };
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    alert(`Order placed successfully!\n\nVehicle: ${vehicle.name}\nTotal: $${totalPrice.toLocaleString()}\n\nThis will be saved to your account database in Phase 3.`);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row pt-16 lg:pt-0 bg-white">
      {/* LEFT: Car Preview */}
      <div className="flex-1 h-[50vh] lg:h-screen bg-white relative">
        <button 
          onClick={onBack} 
          className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition"
        >
          <X className="w-5 h-5" />
        </button>
        <img 
          src={currentImage} 
          alt="Configuration Preview" 
          className="w-full h-full object-contain p-8 transition-all duration-700" 
          key={currentImage}
        />
        <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-gray-200">
          <div className="text-sm text-gray-600 font-medium">Your {vehicle.name}</div>
          <div className="text-3xl font-bold text-slate-900">${totalPrice.toLocaleString()}</div>
        </div>
      </div>

      {/* RIGHT: Configuration Panel */}
      <div className="w-full lg:w-[480px] bg-white p-8 flex flex-col gap-6 overflow-y-auto h-[50vh] lg:h-screen border-l border-gray-200">
        <div className="space-y-2 pb-4 border-b">
          <h2 className="text-4xl font-semibold text-slate-900">{vehicle.name}</h2>
          <p className="text-gray-600 text-sm">Est. Delivery: 2-4 Weeks</p>
        </div>

        {/* Current Specs */}
        <div className="grid grid-cols-3 gap-4 py-4 bg-gray-50 rounded-xl px-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{selectedBattery?.range}</div>
            <div className="text-xs text-gray-600 font-medium">Range</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-2xl font-bold text-slate-900">{selectedBattery?.topSpeed}</div>
            <div className="text-xs text-gray-600 font-medium">Top Speed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{selectedBattery?.acceleration}</div>
            <div className="text-xs text-gray-600 font-medium">0-60 mph</div>
          </div>
        </div>

        {/* Battery Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Battery</h3>
          </div>
          <div className="space-y-2">
            {vehicle.customization.battery.map(b => (
              <button 
                key={b.id} 
                onClick={() => setConfig({...config, battery: b.id})}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  config.battery === b.id 
                    ? 'border-blue-600 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-slate-900">{b.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {b.range} • {b.acceleration} 0-60mph • {b.topSpeed} top speed
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900">
                    {b.price === 0 ? 'Included' : `+${b.price.toLocaleString()}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paint Color */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Paint</h3>
          <div className="flex gap-3 flex-wrap">
            {vehicle.customization.paint.map(p => (
              <button 
                key={p.id} 
                onClick={() => setConfig({...config, paint: p.id})}
                className="relative group"
                title={`${p.name} ${p.price > 0 ? `(+${p.price.toLocaleString()})` : ''}`}
              >
                <div 
                  className={`w-14 h-14 rounded-full shadow-md border-4 transition-all ${
                    config.paint === p.id ? 'border-blue-600 scale-110 shadow-lg' : 'border-gray-200 hover:scale-105'
                  }`} 
                  style={{background: p.hex}} 
                />
                {config.paint === p.id && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          {selectedPaint && (
            <div className="text-sm text-gray-600 font-medium">
              {selectedPaint.name} {selectedPaint.price > 0 && `(+${selectedPaint.price.toLocaleString()})`}
            </div>
          )}
        </div>

        {/* Wheels */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Wheels</h3>
          <div className="grid grid-cols-2 gap-3">
            {vehicle.customization.wheels.map(w => (
              <button 
                key={w.id} 
                onClick={() => setConfig({...config, wheels: w.id})}
                className={`p-4 rounded-xl border-2 transition-all ${
                  config.wheels === w.id 
                    ? 'border-blue-600 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-4xl mb-2">⚙️</div>
                <div className="text-sm font-semibold text-slate-900">{w.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {w.price === 0 ? 'Included' : `+${w.price.toLocaleString()}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Interior */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Interior</h3>
          <div className="grid grid-cols-2 gap-3">
            {vehicle.customization.interior.map(i => (
              <button 
                key={i.id} 
                onClick={() => setConfig({...config, interior: i.id})}
                className={`p-4 rounded-xl border-2 transition-all ${
                  config.interior === i.id 
                    ? 'border-blue-600 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div 
                  className="w-full h-16 rounded-lg mb-3 border-2 border-gray-300"
                  style={{background: i.hex}}
                />
                <div className="text-sm font-semibold text-slate-900">{i.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {i.price === 0 ? 'Included' : `+${i.price.toLocaleString()}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Autopilot */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Autopilot</h3>
          </div>
          <div className="space-y-2">
            {vehicle.customization.autopilot.map(a => (
              <button 
                key={a.id} 
                onClick={() => setConfig({...config, autopilot: a.id})}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  config.autopilot === a.id 
                    ? 'border-blue-600 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-900">{a.name}</div>
                  <div className="font-semibold text-slate-900">
                    {a.price === 0 ? 'Included' : `+${a.price.toLocaleString()}`}
                  </div>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {a.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-auto pt-6 border-t space-y-4 sticky bottom-0 bg-white pb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between font-medium">
              <span className="text-gray-700">Base Price</span>
              <span className="text-slate-900">${vehicle.basePrice.toLocaleString()}</span>
            </div>
            {selectedBattery?.price > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{selectedBattery.name}</span>
                <span>+${selectedBattery.price.toLocaleString()}</span>
              </div>
            )}
            {selectedPaint?.price > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{selectedPaint.name}</span>
                <span>+${selectedPaint.price.toLocaleString()}</span>
              </div>
            )}
            {selectedWheels?.price > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{selectedWheels.name}</span>
                <span>+${selectedWheels.price.toLocaleString()}</span>
              </div>
            )}
            {selectedInterior?.price > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{selectedInterior.name}</span>
                <span>+${selectedInterior.price.toLocaleString()}</span>
              </div>
            )}
            {selectedAutopilot?.price > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{selectedAutopilot.name}</span>
                <span>+${selectedAutopilot.price.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between text-xl font-bold pt-3 border-t">
            <span className="text-slate-900">Total Price</span>
            <span className="text-blue-600">${totalPrice.toLocaleString()}</span>
          </div>
          
          <button 
            onClick={handleOrder}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <ShoppingCart className="w-5 h-5" />
            Order Now
          </button>
          
          {!user && (
            <p className="text-xs text-center text-gray-500">
              You must be logged in to place an order
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Signup Popup Component
const SignupPopup = ({ email, onClose, onSwitchToSignup }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full z-10">
      <h3 className="text-2xl font-semibold text-slate-900 mb-4">Account Not Found</h3>
      <p className="text-gray-600 mb-6">
        No account found with email <span className="font-medium text-slate-900">{email}</span>. 
        Please create an account first to continue.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onSwitchToSignup}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Create Account
        </button>
        <button
          onClick={onClose}
          className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// Login Component
const Login = ({ onNavigate }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [data, setData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowSignupPopup(false);
    
    try {
      const res = isSignup 
        ? await signup(data.name, data.email, data.password) 
        : await login(data.email, data.password);
        
      if (res.success) {
        onNavigate('home');
      } else {
        if (res.showSignupPopup) {
          setShowSignupPopup(true);
        } else {
          setError(res.error || 'Authentication failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToSignup = () => {
    setShowSignupPopup(false);
    setIsSignup(true);
    setError('');
  };

  return (
    <>
      {showSignupPopup && (
        <SignupPopup 
          email={data.email} 
          onClose={() => setShowSignupPopup(false)}
          onSwitchToSignup={handleSwitchToSignup}
        />
      )}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-lg space-y-6">
          <h2 className="text-3xl font-semibold text-slate-900">{isSignup ? 'Create Account' : 'Sign In'}</h2>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input 
                  required 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
                  value={data.name} 
                  onChange={e=>setData({...data, name: e.target.value})} 
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input 
                required 
                type="email" 
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
                value={data.email} 
                onChange={e=>setData({...data, email: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input 
                required 
                type="password" 
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
                value={data.password} 
                onChange={e=>setData({...data, password: e.target.value})} 
              />
            </div>
            <button 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex justify-center items-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>
          <div className="text-center">
            <button 
              onClick={() => { setIsSignup(!isSignup); setError(''); setShowSignupPopup(false); }} 
              className="text-sm text-blue-600 hover:underline underline-offset-4"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Account Page Component
const AccountPage = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gray-50">
        <div className="text-center bg-white p-12 rounded-2xl shadow-lg">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-4 text-slate-900">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your account</p>
          <button 
            onClick={() => onNavigate('login')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h1 className="text-4xl font-semibold text-slate-900">My Account</h1>
              <p className="text-gray-600 mt-2">Manage your Tesla profile and orders</p>
            </div>
            <button 
              onClick={() => onNavigate('home')}
              className="text-blue-600 hover:underline font-medium"
            >
              ← Back to Home
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Name</label>
              <div className="text-xl font-semibold text-slate-900">{user.name || 'N/A'}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Email</label>
              <div className="text-xl font-semibold text-slate-900">{user.email}</div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-2xl font-semibold mb-4 text-slate-900">Order History</h3>
            <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 font-medium mb-2">No orders yet</p>
              <p className="text-sm text-gray-500">Orders will be saved here in Phase 3 (Backend Integration)</p>
            </div>
          </div>

          <div className="border-t pt-6 flex gap-4">
            <button 
              onClick={() => onNavigate('home')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              Browse Vehicles
            </button>
            <button 
              onClick={logout}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const TeslaApp = () => {
  const [page, setPage] = useState('home');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const handleSelect = (id) => { setSelectedVehicle(id); setPage('configurator'); };
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4"/>
          <p className="text-gray-600">Loading Tesla...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {page !== 'configurator' && <Navigation currentPage={page} onNavigate={setPage} />}
      {page === 'home' && <Homepage onSelectVehicle={handleSelect} />}
      {page === 'configurator' && selectedVehicle && (
        <Configurator vehicleId={selectedVehicle} onBack={() => setPage('home')} onNavigate={setPage} />
      )}
      {page === 'login' && <Login onNavigate={setPage} />}
      {page === 'account' && <AccountPage onNavigate={setPage} />}
    </div>
  );
};

// Root Component with Auth Provider
const App = () => (
  <AuthProvider>
    <TeslaApp />
  </AuthProvider>
);

export default App;