import React from 'react';

export default function SeatMap({ capacity = 60, config = '2x2', taken = [], selected = [], onToggle }) {
  const cols = config === '2x3' ? 5 : 4;
  const gapColIndex = config === '2x3' ? 2 : 2; // aisle after 2 seats
  const cells = [];
  for (let i = 1; i <= capacity; i++) cells.push(i);
  const renderSeat = (seatNumber) => {
    const col = (seatNumber - 1) % cols + 1;
    const isAisle = col === gapColIndex + 1;
    const isTaken = taken.includes(seatNumber);
    const isSelected = selected.includes(seatNumber);
    return (
      <div key={seatNumber} style={{ gridColumn: isAisle ? `${col + 1}` : col }}>
        <button
          type="button"
          onClick={() => !isTaken && onToggle?.(seatNumber)}
          disabled={isTaken}
          style={{
            width: 32, height: 32, borderRadius: 6,
            background: isTaken ? '#aaa' : isSelected ? '#1976d2' : '#e2e8f0',
            color: isTaken ? '#666' : isSelected ? '#fff' : '#0f172a',
            border: '1px solid #94a3b8', cursor: isTaken ? 'not-allowed' : 'pointer'
          }}
          title={`Seat ${seatNumber}`}
        >{seatNumber}</button>
      </div>
    );
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols + 1}, 36px)`, gap: 6 }}>
      {cells.map(renderSeat)}
    </div>
  );
}


