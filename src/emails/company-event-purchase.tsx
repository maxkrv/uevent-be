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

interface ComapnyEventPurchaseProps {
  name: string;
  eventTitle: string;
  link: string;
}

export const ComapnyEventPurchase = ({
  name,
  eventTitle,
  link,
}: ComapnyEventPurchaseProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Your ticket for "{eventTitle}" has been successfully purchased!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hi {name},</Heading>
          <Text style={text}>
            Your purchase was successful! You've secured your spot for:
          </Text>
          <Section style={eventBlock}>
            <Text style={eventTitleStyle}>{eventTitle}</Text>
            <Link style={linkStyle} href={link}>
              View your ticket →
            </Link>
          </Section>
          <Text style={text}>
            We look forward to seeing you at the event. You can find all the
            event details by clicking the link above.
          </Text>
          <Text style={footerText}>
            Need help or have questions? Contact our support anytime.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ComapnyEventPurchase;

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
  backgroundColor: '#d1fae5',
  padding: '16px',
  borderRadius: '6px',
  marginTop: '12px',
  marginBottom: '16px',
};

const eventTitleStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#047857',
  marginBottom: '8px',
};

const linkStyle = {
  fontSize: '14px',
  color: '#065f46',
  textDecoration: 'underline',
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '24px',
};
