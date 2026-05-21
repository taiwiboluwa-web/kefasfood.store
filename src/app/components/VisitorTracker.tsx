import { useEffect } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function VisitorTracker() {
  useEffect(() => {
    // Only track once per session by checking sessionStorage
    if (typeof window !== 'undefined' && !sessionStorage.getItem('kefas_visit_tracked')) {
      trackVisit();
      sessionStorage.setItem('kefas_visit_tracked', 'true');
    }
  }, []);

  const trackVisit = async () => {
    try {
      const timestamp = Date.now();
      const newVisit = {
        id: crypto.randomUUID(),
        timestamp,
        date: new Date(timestamp).toISOString(),
        userAgent: navigator.userAgent || "Unknown Device",
        ip: "Local",
        path: window.location.pathname
      };

      const storedVisits = localStorage.getItem('kefas_local_visits');
      let visits = [];
      try {
        visits = storedVisits ? JSON.parse(storedVisits) : [];
      } catch (e) {
        visits = [];
      }
      visits.push(newVisit);
      localStorage.setItem('kefas_local_visits', JSON.stringify(visits));
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  return null; // Invisible component
}
