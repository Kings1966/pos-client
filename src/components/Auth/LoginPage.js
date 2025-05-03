import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// Animations
const letterFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const glow = keyframes`
  0% { text-shadow: 0 0 5px #ffd700, 0 0 10px #ffd700; }
  50% { text-shadow: 0 0 20px #ffd700, 0 0 30px #ffd700; }
  100% { text-shadow: 0 0 5px #ffd700, 0 0 10px #ffd700; }
`;
const mistPulse = keyframes`
  0% { background-position: 0% 50%; opacity: 0.3; }
  50% { background-position: 100% 50%; opacity: 0.5; }
  100% { background-position: 0% 50%; opacity: 0.3; }
`;
const lightRays = keyframes`
  0% { transform: rotate(0deg); opacity: 0.2; }
  50% { opacity: 0.4; }
  100% { transform: rotate(360deg); opacity: 0.2; }
`;

// Styled Components
const LoginContainer = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #4169e1 0%, #800080 100%);
  position: relative;
`;
const LogoWrapper = styled.div`
  position: absolute;
  top: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const KingsText = styled.div`
  font-size: 8rem;
  font-family: 'Times New Roman', serif;
  font-weight: bold;
  color: #ffd700;
  position: relative;
  display: flex;
  animation: ${glow} 2s infinite;
  animation-delay: 4s;
`;
const Letter = styled.span`
  display: inline-block;
  opacity: 0;
  animation: ${letterFadeIn} 0.5s ease forwards;
  animation-delay: ${(props) => props.$delay}s;
`;
const GoldMist = styled.div`
  position: absolute;
  width: 600px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0) 70%);
  animation: ${mistPulse} 5s infinite;
  animation-delay: 4s;
  z-index: -1;
`;
const LightRays = styled.div`
  position: absolute;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
  clip-path: polygon(
    50% 0%, 55% 5%, 60% 0%, 65% 5%, 70% 0%, 75% 5%, 80% 0%, 85% 5%, 90% 0%, 95% 5%,
    100% 50%, 95% 55%, 100% 60%, 95% 65%, 100% 70%, 95% 75%, 100% 80%, 95% 85%, 100% 90%, 95% 95%,
    50% 100%, 45% 95%, 40% 100%, 35% 95%, 30% 100%, 25% 95%, 20% 100%, 15% 95%, 10% 100%, 5% 95%,
    0% 50%, 5% 45%, 0% 40%, 5% 35%, 0% 30%, 5% 25%, 0% 20%, 5% 15%, 0% 10%, 5% 5%
  );
  animation: ${lightRays} 10s infinite linear;
  animation-delay: 4s;
  z-index: -1;
`;
const FormWrapper = styled.div`
  perspective: 1000px;
`;
const Form = styled.form`
  padding: 2rem;
  width: 300px;
  background: linear-gradient(135deg, #1c2526 0%, #2c3e50 100%);
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  transform: rotateY(5deg) rotateX(5deg);
  position: relative;
  border: 3px solid #ffd700;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 10px;
    background: #ffd700;
    border-bottom: 2px solid #000;
  }
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -10px;
    width: 10px;
    height: 100%;
    background: linear-gradient(90deg, #1c2526 0%, #2c3e50 100%);
    transform: rotateY(-30deg);
    border-left: 3px solid #ffd700;
  }
`;
const Title = styled.h2`
  color: #ffd700;
  text-align: center;
  margin-bottom: 1.5rem;
  font-family: 'Times New Roman', serif;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
`;
const Input = styled.input`
  display: block;
  margin-bottom: 1rem;
  width: 100%;
  padding: 10px;
  border: 1px solid #ffd700;
  border-radius: 4px;
  background: #ffffff;
  color: #000;
  font-family: 'Times New Roman', serif;
  &:focus {
    outline: none;
    border-color: #ffeb3b;
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }
`;
const Button = styled.button`
  width: 100%;
  padding: 10px;
  background: #ffd700;
  color: #1c2526;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
  font-family: 'Times New Roman', serif;
  font-weight: bold;
  &:hover {
    background: #ffeb3b;
  }
`;
const Error = styled.p`
  color: #ff4d4d;
  margin-bottom: 1rem;
  text-align: center;
`;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { email, password } = formData;
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/login`,
        { email, password },
        { withCredentials: true }
      );
      console.log('Login response:', res.data);
      console.log('Response headers:', res.headers);
      const user = res.data.user;
      await login(user); // Wait for login to complete
      navigate('/');
    } catch (err) {
      console.error('Login failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
      });
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  const letters = ['K', 'I', 'N', 'G', 'S'].map((letter, index) => (
    <Letter key={index} $delay={index * 0.6}>
      {letter}
    </Letter>
  ));

  return (
    <LoginContainer>
      <LogoWrapper>
        <KingsText>
          {letters}
          <GoldMist />
          <LightRays />
        </KingsText>
      </LogoWrapper>
      <FormWrapper>
        <Form onSubmit={handleSubmit}>
          <Title>Login</Title>
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {error && <Error>{error}</Error>}
          <Button type="submit">Login</Button>
        </Form>
      </FormWrapper>
    </LoginContainer>
  );
};

export default LoginPage;