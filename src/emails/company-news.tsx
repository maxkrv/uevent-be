import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface CompanyNewsProps {
  name: string;
  companyName: string;
  newsTitle: string;
  link: string;
}

export const CompanyNews = ({
  name,
  companyName,
  newsTitle,
  link,
}: CompanyNewsProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {companyName} published a new update: {newsTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hello, {name} 👋</Heading>
          <Text style={text}>
            <strong>{companyName}</strong> just released a new announcement:
          </Text>
          <Section style={newsBlock}>
            <Text style={newsTitleStyle}>{newsTitle}</Text>
            <Link style={linkStyle} href={link}>
              Go to news →
            </Link>
          </Section>
          <Text style={footerText}>
            Thank you for staying up to date with {companyName}!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CompanyNews;

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: 'Arial, sans-serif',
  padding: '24px',
};

const container = {
  backgroundColor: '#ffffff',
  padding: '32px',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
};

const heading = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '12px',
};

const text = {
  fontSize: '14px',
  color: '#333333',
  marginBottom: '8px',
};

const newsBlock = {
  backgroundColor: '#f0f4ff',
  padding: '16px',
  borderRadius: '6px',
  marginTop: '12px',
  marginBottom: '16px',
};

const newsTitleStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1d4ed8',
  marginBottom: '8px',
};

const linkStyle = {
  fontSize: '14px',
  color: '#2563eb',
  textDecoration: 'underline',
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '24px',
};
