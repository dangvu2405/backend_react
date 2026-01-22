const express = require('express');
const authRouter = require('./Auth.js');
const apiRouter = require('./api.js');
const userRouter = require('./user.js');
const cartRouter = require('./cart.js');
const adminRouter = require('./admin.js');
const reviewsRouter = require('./reviews.js');
const paymentRouter = require('./payment.routes.js');
const chatRouter = require('./chat.js');
const walletRouter = require('./wallet.js');
const mmoShopRouter = require('./mmo-shop.js');
const projectsRouter = require('./projects.js');
const projectCategoriesRouter = require('./project-categories.js');

function router(app) {
    app.use('/auth', authRouter);   
    app.use('/api', apiRouter);
    app.use('/api/projects', projectsRouter);
    app.use('/api/project-categories', projectCategoriesRouter);
    app.use('/user', userRouter);
    app.use('/cart', cartRouter);
    app.use('/admin', adminRouter);
    app.use('/api/reviews', reviewsRouter);
    app.use('/payment', paymentRouter);
    app.use('/chat', chatRouter);
    app.use('/api/wallet', walletRouter);
    app.use('/wallet', walletRouter); // Support frontend calls without /api prefix
    app.use('/api/mmo-shop', mmoShopRouter);
}

module.exports = router;