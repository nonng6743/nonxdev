const fastify = require('fastify')({ logger: true })
require('dotenv').config()

fastify.register(require('@fastify/cors'), { 
  origin: true
})

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method
  })
  reply.code(500).send({ 
    success: false, 
    message: error.message || 'Internal server error' 
  })
})

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

fastify.get('/health', async (request, reply) => {
  return { status: 'ok' }
})

const nodemailer = require('nodemailer')

fastify.post('/contact', async (request, reply) => {
  try {
    fastify.log.info('Contact request received', { body: request.body })
    
    const { name, email, message } = request.body || {}
    
    // Validate required fields
    if (!name || !email || !message) {
      fastify.log.warn('Missing required fields', { name, email, message })
      return reply.code(400).send({ 
        success: false, 
        message: 'Missing required fields: name, email, and message are required' 
      })
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      fastify.log.error('Email credentials not configured', { 
        hasUser: !!process.env.EMAIL_USER, 
        hasPass: !!process.env.EMAIL_PASS 
      })
      return reply.code(500).send({ 
        success: false, 
        message: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.' 
      })
    }
  
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify transporter connection
    try {
      await transporter.verify()
      fastify.log.info('Email transporter verified successfully')
    } catch (verifyError) {
      fastify.log.error('Email transporter verification failed:', verifyError)
      return reply.code(500).send({ 
        success: false, 
        message: 'Email service authentication failed. Please check your email credentials.' 
      })
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'nonxdev@gmail.com',
      subject: `New Contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`
    };

    await transporter.sendMail(mailOptions);
    fastify.log.info(`Email sent successfully from ${email}`)
    return { success: true, message: 'Message sent successfully' }
  } catch (error) {
    fastify.log.error('Error in /contact endpoint:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return reply.code(500).send({ 
      success: false, 
      message: error.message || 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

const start = async () => {
  try {
    const port = process.env.PORT || 8080
    const host = process.env.ADDRESS || '0.0.0.0'
    await fastify.listen({ port, host })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
