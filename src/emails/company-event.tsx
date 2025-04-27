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

interface CompanyEventProps {
  name: string;
  companyName: string;
  eventTitle: string;
  link: string;
}

export const CompanyEvent = ({
  name,
  companyName,
  eventTitle,
  link,
}: CompanyEventProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {companyName} announced a new event: {eventTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hey {name},</Heading>
          <Text style={text}>
            <strong>{companyName}</strong> just published a new event you might
            be interested in:
          </Text>
          <Section style={eventBlock}>
            <Text style={eventTitleStyle}>{eventTitle}</Text>
            <Link style={linkStyle} href={link}>
              View event details →
            </Link>
          </Section>
          <Text style={footerText}>
            Stay tuned for more exciting updates from {companyName}!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CompanyEvent;

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

const eventBlock = {
  backgroundColor: '#e0f2fe',
  padding: '16px',
  borderRadius: '6px',
  marginTop: '12px',
  marginBottom: '16px',
};

const eventTitleStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0284c7',
  marginBottom: '8px',
};

const linkStyle = {
  fontSize: '14px',
  color: '#0369a1',
  textDecoration: 'underline',
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '24px',
};
