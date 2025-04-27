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

interface CommentReplyProps {
  name: string;
  content: string;
  link: string;
}

export const CommentReply = ({ name, content, link }: CommentReplyProps) => {
  return (
    <Html>
      <Head />
      <Preview>Someone replied to your comment</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Hey {name},</Heading>
          <Text style={text}>You’ve got a new reply to your comment:</Text>
          <Section style={replyBlock}>
            <Text style={replyContentStyle}>{content}</Text>
            <Link style={linkStyle} href={link}>
              View the full thread →
            </Link>
          </Section>
          <Text style={footerText}>
            Stay engaged and keep the conversation going!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CommentReply;

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

const replyBlock = {
  backgroundColor: '#fef9c3',
  padding: '16px',
  borderRadius: '6px',
  marginTop: '12px',
  marginBottom: '16px',
};

const replyContentStyle = {
  fontSize: '14px',
  fontStyle: 'italic',
  color: '#92400e',
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
