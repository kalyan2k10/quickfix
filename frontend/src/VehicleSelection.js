import React from 'react';
import './VehicleSelection.css';

const VehicleSelection = ({ onVehicleSelect }) => {
    return (
        <div className="vehicle-selection-page">
            <div className="selection-container">
                <h1 className="page-title">Don't worry, we got your back!</h1>
                <p className="page-subtitle">First, select your vehicle type to find the right help.</p>
                <div className="vehicle-options">
                    {/* Two Wheeler Knob */}
                    <div className="vehicle-knob" onClick={() => onVehicleSelect('bike')}>
                        <div className="knob-icon">🏍️</div>
                        <div className="knob-label">Two Wheeler</div>
                    </div>

                    {/* Four Wheeler Knob */}
                    <div className="vehicle-knob" onClick={() => onVehicleSelect('car')}>
                        <div className="knob-icon">🚗</div>
                        <div className="knob-label">Four Wheeler</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleSelection;