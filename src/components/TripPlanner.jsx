import { useState } from 'react';

const CATEGORY_EMOJI = {
  food: '🍜',
  sightseeing: '🏛️',
  activity: '🎟️',
  transport: '🚗',
  rest: '🛌',
};

export default function TripPlanner({ trip, onChange }) {
  const [expandedId, setExpandedId] = useState(null);
  const [activeDay, setActiveDay] = useState(trip.days[0]?.day ?? 1);

  function updateDay(dayNumber, updater) {
    const days = trip.days.map((d) => (d.day === dayNumber ? updater(d) : d));
    onChange({ ...trip, days });
  }

  function removeStop(dayNumber, stopId) {
    updateDay(dayNumber, (d) => ({ ...d, stops: d.stops.filter((s) => s.id !== stopId) }));
  }

  function moveStop(dayNumber, index, direction) {
    updateDay(dayNumber, (d) => {
      const stops = [...d.stops];
      const target = index + direction;
      if (target < 0 || target >= stops.length) return d;
      [stops[index], stops[target]] = [stops[target], stops[index]];
      return { ...d, stops };
    });
  }

  const currentDay = trip.days.find((d) => d.day === activeDay) ?? trip.days[0];

  return (
    <div className="trip-planner">
      <header className="trip-header">
        <h2>{trip.title}</h2>
        <p className="trip-destination">{trip.destination}</p>
      </header>

      <div className="day-tabs" role="tablist">
        {trip.days.map((d) => (
          <button
            key={d.day}
            role="tab"
            aria-selected={d.day === activeDay}
            className={d.day === activeDay ? 'day-tab active' : 'day-tab'}
            onClick={() => setActiveDay(d.day)}
          >
            Day {d.day}
          </button>
        ))}
      </div>

      {currentDay && (
        <div className="day-panel">
          <h3>{currentDay.title}</h3>
          {currentDay.stops.length === 0 ? (
            <p className="empty-day">No stops left for this day — everything's been removed.</p>
          ) : (
            <ul className="stop-list">
              {currentDay.stops.map((stop, index) => {
                const expanded = expandedId === stop.id;
                return (
                  <li key={stop.id} className={expanded ? 'stop expanded' : 'stop'}>
                    <div
                      className="stop-row"
                      onClick={() => setExpandedId(expanded ? null : stop.id)}
                    >
                      <span className="stop-emoji">{CATEGORY_EMOJI[stop.category] || '📍'}</span>
                      <span className="stop-time">{stop.time}</span>
                      <span className="stop-name">{stop.name}</span>
                    </div>

                    {expanded && stop.description && (
                      <p className="stop-description">{stop.description}</p>
                    )}

                    <div className="stop-actions">
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveStop(currentDay.day, index, -1);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={index === currentDay.stops.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveStop(currentDay.day, index, 1);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label="Remove stop"
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStop(currentDay.day, stop.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
