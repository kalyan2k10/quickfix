import React from 'react';
import './UserHomepage.css';
import carImage from './images/car.jpeg';
import keyImage from './images/key.jpeg';
import mechanicImage from './images/mechanic.jpeg';

const UserHomepage = ({ onGetRescued, onSelectService }) => {
    return ( 
        <div className="user-homepage">
            
            <section id="services">
                <div className="container">
                    <h2 className="section-title">Select your problem type</h2>
                    <div className="services-grid">
                        <div className="service-card" onClick={() => onSelectService('Flat Tyre')}>
                            <img src={carImage} alt="Puncture Repair" className="service-image" />
                            <h4>Puncture Repair Assistance</h4>
                            <p className="price">Starts at ₹ 499</p>
                        </div>
                        <div className="service-card" onClick={() => onSelectService('Towing Service')}>
                            <img src={carImage} alt="Car Towing" className="service-image" />
                            <h4>Car Towing Assistance</h4>
                            <p className="price">Starts at ₹ 2999</p>
                        </div>
                        <div className="service-card" onClick={() => onSelectService('Battery Jumpstart')}>
                            <img src={carImage} alt="Battery Jumpstart" className="service-image" />
                            <h4>Battery Jumpstart</h4>
                            <p className="price">Starts at ₹ 599</p>
                        </div>
                        <div className="service-card" onClick={() => onSelectService('Out of Fuel')}>
                            <img src={carImage} alt="Emergency Fuel" className="service-image" />
                            <h4>Emergency Fuel Delivery</h4>
                            <p className="price">Starts at ₹ 399</p>
                        </div>
                        <div className="service-card" onClick={() => onSelectService('Key Lockout')}>
                            <img src={keyImage} alt="Key Recovery" className="service-image" />
                            <h4>Key Recovery Services</h4>
                            <p className="price">Starts at ₹ 999</p>
                        </div>
                        <div className="service-card" onClick={() => onSelectService('Minor Repairs')}>
                            <img src={mechanicImage} alt="Minor Repairs" className="service-image" />
                            <h4>Minor Mechanical Repairs</h4>
                            <p className="price">Starts at ₹ 599</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" style={{ backgroundColor: 'var(--light-bg)', padding: '60px 0' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 className="section-title">What Makes Us So Good?</h2>
                    <p style={{ fontSize: '1.2em', maxWidth: '800px', margin: '0 auto 40px' }}>
                        "The best in the business! None of the roadside mechanics can do a better job in case of breakdown emergencies." - <strong>Karishma, Fashion Designer</strong>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ width: '250px', textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--accent-color)' }}>10 Mins Reach Time</h4>
                            <p>Mechanics located nearby ensure we reach you within 10 minutes.</p>
                        </div>
                        <div style={{ width: '250px', textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--accent-color)' }}>Trained Mechanics</h4>
                            <p>OEM Certified Mechanics fix over 98% of all calls on-spot.</p>
                        </div>
                        <div style={{ width: '250px', textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--accent-color)' }}>24/7 Availability</h4>
                            <p>Team RESCUE has over 50 Service Providers assisting you 24/7.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer id="contact">
                <div className="container footer-grid">
                    <div>
                        <h5>RESCUE®</h5>
                        <p>#105, Raheja Plaza,<br />Richmond Road, Bengaluru, 560 025</p>
                        <p>+91 9986 500 500<br />connect@getrescued.in</p>
                    </div>
                    <div>
                        <h5>Company</h5>
                        <ul>
                            <li><a href="#">Our Story</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">Contact Us</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5>Services</h5>
                        <ul>
                            <li><a href="#">Towing Services</a></li>
                            <li><a href="#">Battery Jump Start</a></li>
                            <li><a href="#">Emergency Fuel</a></li>
                            <li><a href="#">Key Recovery</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5>Legal</h5>
                        <ul>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms & Conditions</a></li>
                            <li><a href="#">Cancellation & Refund</a></li>
                        </ul>
                    </div>
                    <div className="copyright">
                        &copy; 2024 RESCUE®. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default UserHomepage;