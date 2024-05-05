import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './footer.css';

import { BsFacebook } from 'react-icons/bs';
import { AiFillInstagram, AiFillTwitterCircle } from 'react-icons/ai';
import { IoLogoWhatsapp } from 'react-icons/io';

const Index = () => {
  return (
    <div
      style={{
        backgroundColor: 'rgb(38, 69, 100)',
        color: 'white',
        minHeight: '150px',
      }}>
      <Container>
        {
        }
        <Row>
          <Col md={4} sm={6} xs={6}>
            <div style={{ marginTop: '50px' }} className="footer_p">
              <h5>STORE</h5>
              <p>
                No. 14 Sauni opposite Zainab house,
                <br />
                Giginyu ,
              </p>
              <p>Kano</p>
            </div>
          </Col>

          <Col md={4} sm={6} xs={6}>
            <div style={{ marginTop: '50px' }} className="footer_p">
              <h5>Contact Us</h5>
              <p>Phone number: +2349038168720</p>
              <p>WhatsAPP: +23438168720</p>
              <p>Email: sammiepius10@gmail.com</p>
            </div>
          </Col>

          <Col md={4} sm={6} xs={6}>
            <div style={{ marginTop: '50px' }} className="footer_p">
              <h5>Connect with Us</h5>
              <BsFacebook
                style={{ cursor: 'pointer', color: 'rgb(160, 165, 170)' }}
                size="15px"
              />{' '}
              {'   '}
              <AiFillInstagram
                style={{ cursor: 'pointer', color: 'rgb(160, 165, 170)' }}
                size="15px"
              />
              {'   '}
              <AiFillTwitterCircle
                style={{ cursor: 'pointer', color: 'rgb(160, 165, 170)' }}
                size="15px"
              />
              {'   '}
              <IoLogoWhatsapp
                style={{ cursor: 'pointer', color: 'rgb(160, 165, 170)' }}
                size="15px"
              />
            </div>
          </Col>
        </Row>

        {
          // <p className="mt-5 mb-1">&#169; Copyright Lisafi.com</p>
        }
      </Container>
    </div>
  );
};

export default Index;
