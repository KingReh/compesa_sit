import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Map, Compass } from 'lucide-react';
import { parseDMS } from '../utils';

interface MapModalProps {
  location: {
    nome: string;
    latitude: string;
    longitude: string;
  };
  onClose: () => void;
}

export function MapModal({ location, onClose }: MapModalProps) {
  const [shouldRenderMap, setShouldRenderMap] = useState(false);

  useEffect(() => {
    // Add a slight delay before rendering the iframe to ensure modal animation is smooth
    // and load only when active.
    const timer = setTimeout(() => {
      setShouldRenderMap(true);
    }, 150);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const getMapIframeUrl = (lat: string, lng: string) => {
    const q = encodeURIComponent(`${lat} ${lng}`);
    return `https://maps.google.com/maps?q=${q}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  };

  // Safe decimal parsing for external Google Maps / Street View URLs
  const getCoordinates = (latStr: string, lngStr: string) => {
    const parsedLat = parseDMS(latStr);
    const parsedLng = parseDMS(lngStr);
    
    const lat = parsedLat !== null ? parsedLat : parseFloat(latStr);
    const lng = parsedLng !== null ? parsedLng : parseFloat(lngStr);
    
    if (isNaN(lat) || isNaN(lng)) {
      return { lat: latStr, lng: lngStr, isNumeric: false };
    }
    return { lat: lat.toString(), lng: lng.toString(), isNumeric: true };
  };

  const coords = getCoordinates(location.latitude, location.longitude);
  
  // URL to open Google Maps web standard search
  const googleMapsUrl = coords.isNumeric
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps?q=${encodeURIComponent(`${location.latitude} ${location.longitude}`)}`;

  // URL to open Street View standard panorama standard search
  const streetViewUrl = coords.isNumeric
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps?q=${encodeURIComponent(`${location.latitude} ${location.longitude}`)}&layer=c`;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-brand-bg border border-brand-border rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-slide-up relative z-10">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3 max-w-[50%]">
            <div className="p-2 bg-brand-accent/20 rounded-lg shrink-0">
              <MapPin className="w-5 h-5 text-brand-accent" />
            </div>
            <div className="min-w-0">
              <h3 className="typ-card-title text-white truncate">Mapa: {location.nome}</h3>
              <p className="typ-card-desc font-mono mt-0.5 truncate text-[11px]">
                Lat: {location.latitude} | Lng: {location.longitude}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-panel border border-brand-border hover:border-brand-accent hover:bg-brand-panel-light transition-all shadow-sm hover:shadow active:scale-95 group"
              title="Abrir no Google Maps (Site Oficial)"
            >
              <Map className="w-4 h-4 text-brand-accent group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">Google Maps</span>
            </a>
            <a
              href={streetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-panel border border-brand-border hover:border-brand-accent hover:bg-brand-panel-light transition-all shadow-sm hover:shadow active:scale-95 group"
              title="Abrir no Street View (Ponto Terrestre)"
            >
              <Compass className="w-4 h-4 text-brand-accent group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">Street View</span>
            </a>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors border border-transparent hover:border-white/20 active:scale-95"
              title="Fechar Mapa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 w-full bg-black/50 relative flex items-center justify-center">
          {!shouldRenderMap && (
             <div className="text-white/50 animate-pulse flex flex-col items-center gap-2">
               <MapPin className="w-8 h-8 opacity-50" />
               <span className="text-sm">Carregando mapa...</span>
             </div>
          )}
          {shouldRenderMap && (
            <>
              <iframe 
                src={getMapIframeUrl(location.latitude, location.longitude)}
                width="100%" 
                height="100%" 
                className="border-0 w-full h-full animate-fade-in"
                loading="lazy"
                title={`Mapa Expandido ${location.nome}`}
                referrerPolicy="no-referrer-when-downgrade"
              />
              
              {/* Floating map controls for quick action */}
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-panel/90 backdrop-blur border border-brand-border text-white hover:text-brand-accent hover:border-brand-accent hover:scale-105 transition-all shadow-md group"
                  title="Abrir no Google Maps"
                >
                  <Map className="w-5 h-5 text-brand-accent" />
                </a>
                <a
                  href={streetViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-panel/90 backdrop-blur border border-brand-border text-white hover:text-brand-accent hover:border-brand-accent hover:scale-105 transition-all shadow-md group"
                  title="Abrir no Street View"
                >
                  <Compass className="w-5 h-5 text-brand-accent" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
