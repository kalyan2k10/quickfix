import React from 'react';
import './UserHomepage.css';

const UserHomepage = ({ onGetRescued, onSelectService }) => {
    return ( 
        <div className="user-homepage">
            <header>
                <div className="container nav-content">
                    <div className="logo">RESCUE®</div>
                    <nav>
                        <a href="#services">Services</a>
                        <a href="#process">How it Works</a>
                        <a href="#contact">Contact</a>
                        <span>| Call: +91 9986 500 500</span>
                    </nav>
                </div>
            </header>

            <section id="hero">
                <div className="container">
                    <h1>Roadside Assistance Made Easy!</h1>
                    <p>24/7 Vehicle Breakdown Services. On-spot Puncture, Battery Jumpstart, Towing & more.</p>
                    <button onClick={onGetRescued} className="cta-button">GET RESCUED NOW</button>
                </div>
            </section>

            <section id="process">
                <div className="container">
                    <h2 className="section-title">Get Rescued in 3 Easy Steps</h2>
                    <div className="process-flow">
                        <div className="flow-step">
                            <h3>Connect with RESCUE</h3>
                            <p>Click a service below to start your request.</p>
                        </div>
                        <div className="flow-arrow"></div>
                        <div className="flow-step">
                            <h3>Mechanic Despatched</h3>
                            <p>The nearest available mechanic is assigned to you.</p>
                        </div>
                        <div className="flow-arrow"></div>
                        <div className="flow-step">
                            <h3>Get Rescued!</h3>
                            <p>Our mechanic gets you moving quickly and safely.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="services">
                <div className="container">
                    <h2 className="section-title">Our Premier Roadside Assistance Services</h2>
                    <div className="services-grid">
                        <div className="service-card" onClick={() => onSelectService('Flat Tyre')}>
                            <h4>Puncture Repair Assistance</h4>
                            <p className="price">Starts at ₹ 499</p>
                        </div>
                        <div className="service-card" onClick={() => onSelectService('Towing Service')}>
                            <h4>Car Towing Assistance</h4>
                            <p className="price">Starts at ₹ 2999</p>
                        </div>
                        <div className="service-card" onClick={() => onSelectService('Battery Jumpstart')}>
                            <h4>Battery Jumpstart</h4>
                            <p className="price">Starts at ₹ 599</p>
                        </div>
                        <div className="service-card" onClick={() => onSelectService('Out of Fuel')}>
                            <h4>Emergency Fuel Delivery</h4>
                            <p className="price">Starts at ₹ 399</p>
                        </div>
                        <div className="service-card" onClick={() => onSelectService('Key Lockout')}>
                            <h4>Key Recovery Services</h4>
                            <p className="price">Starts at ₹ 999</p>
                        </div>
                        <div className="service-card" onClick={() => onSelectService('Minor Repairs')}>
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
                            <h4 style={{ color: 'var(--accent-color)' }}>30 Mins Reach Time</h4>
                            <p>Mechanics located nearby ensure we reach you within 30 minutes.</p>
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