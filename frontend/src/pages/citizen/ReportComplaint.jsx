import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Upload, X, ChevronRight, ChevronLeft, MapPin, CheckCircle2, Loader2, Image, Mic } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createComplaint, getComplaint } from '../../api/complaints';
import AIInsightsPanel from '../../components/complaint/AIInsightsPanel';
import { CATEGORIES } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../hooks/useLanguage';
import { translateCategory } from '../../utils/i18n';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STEP_KEYS = ['form_step1', 'form_step2', 'form_step3', 'form_step4'];

const MapClickHandler = ({ onSelect }) => {
  useMapEvents({ click: (e) => onSelect(e.latlng) });
  return null;
};

const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], 15);
    }
  }, [coords, map]);
  return null;
};

const StepDot = ({ idx, current, label }) => {
  const done   = idx < current;
  const active = idx === current;
  return (
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors
        ${done   ? 'bg-[#1e40af] border-[#1e40af] text-white' : ''}
        ${active ? 'bg-white border-[#1e40af] text-[#1e40af]' : ''}
        ${!done && !active ? 'bg-white border-gray-300 text-gray-400' : ''}
      `}>
        {done ? <CheckCircle2 size={16} /> : idx + 1}
      </div>
      <span className={`text-xs mt-1 font-medium hidden sm:block ${active ? 'text-[#1e40af]' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
};

const ReportComplaint = () => {
  const navigate    = useNavigate();
  const toast       = useToast();
  const { t }       = useLanguage();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [aiComplaint, setAiComplaint] = useState(null);
  const pollRef = useRef(null);

  // Step 1 — Basic Info
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState(CATEGORIES[0]);

  // Step 2 — Evidence
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  // Step 3 — Location
  const [coords, setCoords]     = useState(null);
  const [address, setAddress]   = useState('');
  const [city, setCity]         = useState('');
  const [country, setCountry]   = useState('');
  const [stateVal, setStateVal] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Voice command / Speech Recognition states
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningDesc, setIsListeningDesc] = useState(false);
  const [isListeningAddress, setIsListeningAddress] = useState(false);
  const [isListeningCity, setIsListeningCity] = useState(false);
  const [isListeningCountry, setIsListeningCountry] = useState(false);
  const [isListeningState, setIsListeningState] = useState(false);

  const [speechErrorTitle, setSpeechErrorTitle] = useState('');
  const [speechErrorDesc, setSpeechErrorDesc] = useState('');
  const [speechErrorAddress, setSpeechErrorAddress] = useState('');
  const [speechErrorCity, setSpeechErrorCity] = useState('');
  const [speechErrorCountry, setSpeechErrorCountry] = useState('');
  const [speechErrorState, setSpeechErrorState] = useState('');

  const recognitionRef = useRef(null);

  const titleBeforeListening = useRef('');
  const descBeforeListening = useRef('');
  const addressBeforeListening = useRef('');
  const cityBeforeListening = useRef('');
  const countryBeforeListening = useRef('');
  const stateBeforeListening = useRef('');

  const isListeningTitleRef = useRef(false);
  const isListeningDescRef = useRef(false);
  const isListeningAddressRef = useRef(false);
  const isListeningCityRef = useRef(false);
  const isListeningCountryRef = useRef(false);
  const isListeningStateRef = useRef(false);

  const hasSpokenTitle = useRef(false);
  const hasSpokenDesc = useRef(false);
  const hasSpokenAddress = useRef(false);
  const hasSpokenCity = useRef(false);
  const hasSpokenCountry = useRef(false);
  const hasSpokenState = useRef(false);

  const hadPermissionErrorTitle = useRef(false);
  const hadPermissionErrorDesc = useRef(false);
  const hadPermissionErrorAddress = useRef(false);
  const hadPermissionErrorCity = useRef(false);
  const hadPermissionErrorCountry = useRef(false);
  const hadPermissionErrorState = useRef(false);

  const toggleListening = (target) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const errMsg = "Voice input is not supported in this browser. Please use Chrome or Edge.";
      if (target === 'title') setSpeechErrorTitle(errMsg);
      else if (target === 'description') setSpeechErrorDesc(errMsg);
      else if (target === 'address') setSpeechErrorAddress(errMsg);
      else if (target === 'city') setSpeechErrorCity(errMsg);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    let isListeningRef, beforeListeningRef, hasSpokenRef, hadPermissionErrorRef;
    let setIsListening, setSpeechError, setFieldValue, currentFieldValue;

    if (target === 'title') {
      isListeningRef = isListeningTitleRef;
      beforeListeningRef = titleBeforeListening;
      hasSpokenRef = hasSpokenTitle;
      hadPermissionErrorRef = hadPermissionErrorTitle;
      setIsListening = setIsListeningTitle;
      setSpeechError = setSpeechErrorTitle;
      setFieldValue = setTitle;
      currentFieldValue = title;
    } else if (target === 'description') {
      isListeningRef = isListeningDescRef;
      beforeListeningRef = descBeforeListening;
      hasSpokenRef = hasSpokenDesc;
      hadPermissionErrorRef = hadPermissionErrorDesc;
      setIsListening = setIsListeningDesc;
      setSpeechError = setSpeechErrorDesc;
      setFieldValue = setDescription;
      currentFieldValue = description;
    } else if (target === 'address') {
      isListeningRef = isListeningAddressRef;
      beforeListeningRef = addressBeforeListening;
      hasSpokenRef = hasSpokenAddress;
      hadPermissionErrorRef = hadPermissionErrorAddress;
      setIsListening = setIsListeningAddress;
      setSpeechError = setSpeechErrorAddress;
      setFieldValue = setAddress;
      currentFieldValue = address;
    } else if (target === 'city') {
      isListeningRef = isListeningCityRef;
      beforeListeningRef = cityBeforeListening;
      hasSpokenRef = hasSpokenCity;
      hadPermissionErrorRef = hadPermissionErrorCity;
      setIsListening = setIsListeningCity;
      setSpeechError = setSpeechErrorCity;
      setFieldValue = setCity;
      currentFieldValue = city;
    } else if (target === 'country') {
      isListeningRef = isListeningCountryRef;
      beforeListeningRef = countryBeforeListening;
      hasSpokenRef = hasSpokenCountry;
      hadPermissionErrorRef = hadPermissionErrorCountry;
      setIsListening = setIsListeningCountry;
      setSpeechError = setSpeechErrorCountry;
      setFieldValue = setCountry;
      currentFieldValue = country;
    } else if (target === 'state') {
      isListeningRef = isListeningStateRef;
      beforeListeningRef = stateBeforeListening;
      hasSpokenRef = hasSpokenState;
      hadPermissionErrorRef = hadPermissionErrorState;
      setIsListening = setIsListeningState;
      setSpeechError = setSpeechErrorState;
      setFieldValue = setStateVal;
      currentFieldValue = stateVal;
    }

    setSpeechErrorTitle('');
    setSpeechErrorDesc('');
    setSpeechErrorAddress('');
    setSpeechErrorCity('');
    setSpeechErrorCountry('');
    setSpeechErrorState('');

    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      return;
    }

    isListeningTitleRef.current = false;
    isListeningDescRef.current = false;
    isListeningAddressRef.current = false;
    isListeningCityRef.current = false;
    isListeningCountryRef.current = false;
    isListeningStateRef.current = false;

    setIsListeningTitle(false);
    setIsListeningDesc(false);
    setIsListeningAddress(false);
    setIsListeningCity(false);
    setIsListeningCountry(false);
    setIsListeningState(false);

    beforeListeningRef.current = currentFieldValue;
    hasSpokenRef.current = false;
    hadPermissionErrorRef.current = false;
    isListeningRef.current = true;
    setIsListening(true);

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      const currentTranscript = finalTranscript + interimTranscript;
      if (currentTranscript.trim()) {
        hasSpokenRef.current = true;
      }
      setFieldValue(beforeListeningRef.current + (beforeListeningRef.current ? ' ' : '') + currentTranscript);
    };

    rec.onerror = (event) => {
      console.error(`Speech recognition error on ${target}:`, event.error);
      if (event.error === 'not-allowed') {
        hadPermissionErrorRef.current = true;
        isListeningRef.current = false;
        setIsListening(false);
        setSpeechError('Microphone access was denied. Please allow microphone access in your browser settings to use voice input.');
      } else if (event.error === 'no-speech') {
        // Do NOT show "no speech detected" error immediately
      } else {
        hadPermissionErrorRef.current = true;
        isListeningRef.current = false;
        setIsListening(false);
        setSpeechError('Voice input error: ' + event.error);
      }
    };

    rec.onend = () => {
      if (isListeningRef.current) {
        try {
          rec.start();
        } catch (err) {
          console.error(`Failed to restart speech recognition on ${target}:`, err);
          isListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
        if (!hasSpokenRef.current && !hadPermissionErrorRef.current) {
          setSpeechError('No speech detected. Please try again.');
        }
      }
    };

    recognitionRef.current = rec;
    rec.start();
  };

  useEffect(() => {
    return () => {
      isListeningTitleRef.current = false;
      isListeningDescRef.current = false;
      isListeningAddressRef.current = false;
      isListeningCityRef.current = false;
      isListeningCountryRef.current = false;
      isListeningStateRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  // ─── Polling for AI results ───────────────────────────────────────
  const startPolling = useCallback((id) => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await getComplaint(id);
        const status = data.complaint?.status;
        if (status && status !== 'submitted' && status !== 'ai_processed' && status !== 'evidence_verified') {
          setAiComplaint(data.complaint);
          clearInterval(pollRef.current);
        }
      } catch {}
    }, 2500);
  }, []);

  useEffect(() => () => clearInterval(pollRef.current), []);

  // ─── Evidence helpers ─────────────────────────────────────────────
  const handleFiles = (files) => {
    const imgs = [], vids = [];
    Array.from(files).forEach((f) => {
      if (f.type.startsWith('image/')) imgs.push(f);
      else if (f.type.startsWith('video/')) vids.push(f);
    });
    setImages((p) => [...p, ...imgs].slice(0, 5));
    setVideos((p) => [...p, ...vids].slice(0, 2));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ─── GPS ──────────────────────────────────────────────────────────
  const getGPS = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setGpsLoading(false);

        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then((res) => res.json())
          .then((data) => {
            if (data) {
              const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || '';
              const displayAddr = data.display_name || '';
              const countryName = data.address?.country || '';
              const stateName = data.address?.state || '';
              setAddress(displayAddr);
              setCity(cityName);
              setCountry(countryName);
              setStateVal(stateName);
            }
          })
          .catch((err) => console.error('Reverse geocoding error:', err));
      },
      (err) => {
        console.error('Geolocation error:', err);
        setGpsLoading(false);
        if (err.code === 1) {
          toast.error('Location access denied. Please enable location permissions in your browser settings.');
        } else if (err.code === 2) {
          toast.error('Position unavailable. Please pin it on the map manually.');
        } else if (err.code === 3) {
          toast.error('Location request timed out. Please try again.');
        } else {
          toast.error('Unable to retrieve location. Please pin it manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ─── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('category', category);
      if (coords) {
        fd.append('latitude',  coords.lat);
        fd.append('longitude', coords.lng);
      }
      fd.append('address', address);
      fd.append('city', city);
      fd.append('country', country);
      fd.append('state', stateVal);
      images.forEach((f) => fd.append('images', f));
      videos.forEach((f) => fd.append('videos', f));

      const data = await createComplaint(fd);
      setSubmittedId(data.complaint.id);
      setAiComplaint(data.complaint);
      setStep(4);
      toast.success(t('complaint_submitted_success'));
      startPolling(data.complaint.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Validation per step ─────────────────────────────────────────
  const canProceed = () => {
    if (step === 0) return title.trim().length >= 10 && description.trim().length >= 20;
    if (step === 2) return !!coords;
    return true;
  };

  const stepLabels = STEP_KEYS.map((k) => t(k));

  // ─── Render: success / AI polling ────────────────────────────────
  if (step === 4) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 text-center">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-1">{t('complaint_submitted_success')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('ai_analyzing_results')}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/my-complaints')} className="px-4 py-2 bg-[#1e40af] text-white rounded-lg text-sm font-semibold hover:bg-blue-800">
              {t('nav_my_complaints')}
            </button>
            {submittedId && (
              <button onClick={() => navigate(`/complaints/${submittedId}`)} className="px-4 py-2 border border-[#1e40af] text-[#1e40af] rounded-lg text-sm font-semibold hover:bg-blue-50">
                {t('view_details')}
              </button>
            )}
          </div>
        </div>
        <AIInsightsPanel complaint={aiComplaint} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('report_civic_issue')}</h1>

      {/* Step indicator */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-6 py-4">
        {stepLabels.map((label, idx) => (
          <React.Fragment key={idx}>
            <StepDot idx={idx} current={step} label={label} />
            {idx < stepLabels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${idx < step ? 'bg-[#1e40af]' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step panels */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">

        {/* STEP 0 — Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">{t('form_step1')}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('issue_title')} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('title_placeholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                minLength={10}
              />
              <button
                type="button"
                onClick={() => toggleListening('title')}
                className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span>{isListeningTitle ? '🔴 Listening...' : '🎤 Start Recording'}</span>
              </button>
              {speechErrorTitle && (
                <p className="text-xs text-red-500 mt-1">{speechErrorTitle}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{title.length}/200 — {t('min_chars').replace('{count}', 10)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')} <span className="text-red-500">*</span></label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af] bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{translateCategory(t, c)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_desc')} <span className="text-red-500">*</span></label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('desc_placeholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af] resize-none"
                minLength={20}
              />
              <button
                type="button"
                onClick={() => toggleListening('description')}
                className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span>{isListeningDesc ? '🔴 Listening...' : '🎤 Start Recording'}</span>
              </button>
              {speechErrorDesc && (
                <p className="text-xs text-red-500 mt-1">{speechErrorDesc}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{description.length} chars — {t('min_chars').replace('{count}', 20)}</p>
            </div>
          </div>
        )}

        {/* STEP 1 — Evidence */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">{t('form_step2')}</h2>
            <p className="text-sm text-gray-500">{t('upload_help')}</p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${dragging ? 'border-[#1e40af] bg-blue-50' : 'border-gray-300 hover:border-[#1e40af] hover:bg-gray-50'}`}
            >
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600">{t('upload_drop')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('upload_types')}</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {(images.length > 0 || videos.length > 0) && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(img)}
                      alt=""
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {videos.map((vid, i) => (
                  <div key={i} className="relative group bg-gray-900 rounded-lg h-20 flex items-center justify-center border border-gray-200">
                    <Image size={20} className="text-gray-400" />
                    <span className="text-xs text-gray-300 absolute bottom-1 left-1 right-1 truncate px-1">{vid.name}</span>
                    <button
                      onClick={() => setVideos((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Location */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">{t('pin_location')} <span className="text-red-500">*</span></h2>

            <div className="flex gap-2">
              <button
                onClick={getGPS}
                disabled={gpsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e40af] text-white text-sm rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-60"
              >
                {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                {t('form_use_location')}
              </button>
              <p className="text-xs text-gray-400 self-center">{t('click_map')}</p>
            </div>

            <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
              <MapContainer
                center={coords ? [coords.lat, coords.lng] : [20.5937, 78.9629]}
                zoom={coords ? 15 : 5}
                style={{ height: '100%', width: '100%' }}
              >
                 <TileLayer
                   attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
                   url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                 />
                <MapClickHandler onSelect={(ll) => {
                  setCoords({ lat: ll.lat, lng: ll.lng });
                  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${ll.lat}&lon=${ll.lng}&format=json`)
                    .then((res) => res.json())
                    .then((data) => {
                      if (data) {
                        const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || '';
                        const displayAddr = data.display_name || '';
                        const countryName = data.address?.country || '';
                        const stateName = data.address?.state || '';
                        setAddress(displayAddr);
                        setCity(cityName);
                        setCountry(countryName);
                        setStateVal(stateName);
                      }
                    })
                    .catch((err) => console.error('Reverse geocoding error:', err));
                }} />
                {coords && <Marker position={[coords.lat, coords.lng]} />}
                {coords && <ChangeMapView coords={coords} />}
              </MapContainer>
            </div>

            {coords && (
              <p className="text-xs text-green-700 font-medium">
                📍 {t('selected_location')}: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Country (optional)</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
                <button
                  type="button"
                  onClick={() => toggleListening('country')}
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <span>{isListeningCountry ? '🔴 Listening...' : '🎤 Start Recording'}</span>
                </button>
                {speechErrorCountry && (
                  <p className="text-xs text-red-500 mt-1">{speechErrorCountry}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">State (optional)</label>
                <input
                  type="text"
                  value={stateVal}
                  onChange={(e) => setStateVal(e.target.value)}
                  placeholder="State name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
                <button
                  type="button"
                  onClick={() => toggleListening('state')}
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <span>{isListeningState ? '🔴 Listening...' : '🎤 Start Recording'}</span>
                </button>
                {speechErrorState && (
                  <p className="text-xs text-red-500 mt-1">{speechErrorState}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('address_optional')}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('address_placeholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
                <button
                  type="button"
                  onClick={() => toggleListening('address')}
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <span>{isListeningAddress ? '🔴 Listening...' : '🎤 Start Recording'}</span>
                </button>
                {speechErrorAddress && (
                  <p className="text-xs text-red-500 mt-1">{speechErrorAddress}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('city_optional')}</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('city_placeholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
                <button
                  type="button"
                  onClick={() => toggleListening('city')}
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <span>{isListeningCity ? '🔴 Listening...' : '🎤 Start Recording'}</span>
                </button>
                {speechErrorCity && (
                  <p className="text-xs text-red-500 mt-1">{speechErrorCity}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">{t('review_submit')}</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">{t('title')}</span><span className="font-medium text-gray-800">{title}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">{t('category')}</span><span className="font-medium text-gray-800">{translateCategory(t, category)}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">{t('form_desc')}</span><span className="text-gray-700 leading-relaxed">{description}</span></div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">{t('evidence')}</span>
                <span className="text-gray-700">
                  {t('images_count').replace('{count}', images.length)}, {t('videos_count').replace('{count}', videos.length)}
                </span>
              </div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">{t('location')}</span>
                <span className="text-gray-700">
                  {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : '—'}
                  {country ? ` · ${country}` : ''}
                  {stateVal ? ` · ${stateVal}` : ''}
                  {city ? ` · ${city}` : ''}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400">{t('submit_note')}</p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} /> {t('form_back')}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-1 px-5 py-2 bg-[#1e40af] text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('form_next')} <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {submitting ? t('submitting') : t('submit_report')}
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportComplaint;
