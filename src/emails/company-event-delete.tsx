import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface CompanyEventCancelledProps {
  name: string;
  companyName: string;
  eventTitle: string;
}

export const CompanyEventDelete = ({
  name,
  companyName,
  eventTitle,
}: CompanyEventCancelledProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {companyName} cancelled the event: {eventTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hello {name},</Heading>
          <Text style={text}>
            We wanted to let you know that <strong>{companyName}</strong> has
            cancelled the event:
          </Text>
          <Section style={eventBlock}>
            <Text style={eventTitleStyle}>{eventTitle}</Text>
          </Section>
          <Text style={text}>
            We understand this might be disappointing. Stay tuned for future
            events from {companyName}.
          </Text>
          <Text style={footerText}>Thank you for using our platform!</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CompanyEventDelete;

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
  backgroundColor: '#fee2e2',
  padding: '16px',
  borderRadius: '6px',
  marginTop: '12px',
  marginBottom: '16px',
};

const eventTitleStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#b91c1c',
  marginBottom: '8px',
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '24px',
};
