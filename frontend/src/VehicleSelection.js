import React from 'react';
import './VehicleSelection.css';
import carImage from './images/car.jpeg';
import bikeImage from './images/bike.jpeg';
import mechanicImage from './images/mechanic.jpeg';
import keyImage from './images/key.jpeg';

const VehicleSelection = ({ onVehicleSelect }) => {
    return (
        <div className="vehicle-selection-page">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Don't worry we got your back!!</h1>
                    <img src={mechanicImage} alt="Mechanic" className="hero-image" />
                </div>
            </section>

            <div className="selection-container">
                <h2 className="page-title">Quick question to get quick response</h2>
                <p className="page-subtitle">Choose your vehicle type to get started.</p>
                <div className="vehicle-options">
                    <div className="vehicle-card" onClick={() => onVehicleSelect('car')}>
                        <img src={carImage} alt="Car" className="vehicle-image" />
                        <button className="vehicle-button">Car</button>
                    </div>
                    <div className="vehicle-card" onClick={() => onVehicleSelect('bike')}>
                        <img src={bikeImage} alt="Bike" className="vehicle-image" />
                        <button className="vehicle-button">Bike</button>
                    </div>
                    <div className="vehicle-card" onClick={() => onVehicleSelect('Key Lockout')}>
                        <img src={keyImage} alt="Key" className="vehicle-image" />
                        <button className="vehicle-button">Key Lockout</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleSelection;