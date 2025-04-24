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

interface EventUpdateTemplateProps {
  name: string;
  eventTitle: string;
  companyName: string;
  link: string;
}

export const CompanyEventUpdate = ({
  name,
  eventTitle,
  companyName,
  link,
}: EventUpdateTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {companyName} updated the event: {eventTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {name},</Heading>
          <Text style={text}>
            <strong>{companyName}</strong> just updated one of their events
            you're subscribed to:
          </Text>
          <Section style={eventBlock}>
            <Text style={eventTitleStyle}>{eventTitle}</Text>
            <Link style={linkStyle} href={link}>
              Check what's new →
            </Link>
          </Section>
          <Text style={footerText}>
            You’re receiving this update because you subscribed to this event.
            Stay informed!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CompanyEventUpdate;

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
  backgroundColor: '#fff7ed',
  padding: '16px',
  borderRadius: '6px',
  marginTop: '12px',
  marginBottom: '16px',
};

const eventTitleStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#d97706',
  marginBottom: '8px',
};

const linkStyle = {
  fontSize: '14px',
  color: '#b45309',
  textDecoration: 'underline',
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '24px',
};
