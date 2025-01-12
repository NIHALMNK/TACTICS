const Orders = require('../../models/orderModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

module.exports = {
    async loadDashboard(req, res) {
        try {
            if (!req.session.admin) {
                return res.status(200).redirect('/admin/login');
            }

            // Get basic stats
            const totalOrders = await Orders.countDocuments();
            const totalRevenue = await Orders.aggregate([
                { $match: { status: { $ne: 'Cancelled' } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]);

            // Get today's stats
            const today = moment().startOf('day');
            const todayStats = await Orders.aggregate([
                {
                    $match: {
                        createdAt: { $gte: today.toDate() },
                        status: { $ne: 'Cancelled' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: '$totalAmount' },
                        orders: { $sum: 1 }
                    }
                }
            ]);

            const revenue = totalRevenue[0]?.total || 0;
            const todayRevenue = todayStats[0]?.revenue || 0;
            const todayOrders = todayStats[0]?.orders || 0;

            return res.status(200).render('admin/dashboard', {
                admin: req.session.admin,
                stats: {
                    totalOrders,
                    totalRevenue: revenue,
                    todayRevenue,
                    todayOrders
                }
            });
        } catch (error) {
            console.error('Dashboard load error:', error);
            res.status(500).render('admin/error', { message: 'Error loading dashboard' });
        }
    },

    async getSalesReport(req, res) {
        try {
            const { startDate, endDate, period } = req.query;
            let query = { status: { $ne: 'Cancelled' } };
            let dateRange = {};

            if (period) {
                const now = moment();
                switch (period) {
                    case 'daily':
                        dateRange.start = moment().startOf('day');
                        dateRange.end = moment().endOf('day');
                        break;
                    case 'weekly':
                        dateRange.start = moment().startOf('week');
                        dateRange.end = moment().endOf('week');
                        break;
                    case 'monthly':
                        dateRange.start = moment().startOf('month');
                        dateRange.end = moment().endOf('month');
                        break;
                    case 'yearly':
                        dateRange.start = moment().startOf('year');
                        dateRange.end = moment().endOf('year');
                        break;
                }
            } else if (startDate && endDate) {
                dateRange.start = moment(startDate);
                dateRange.end = moment(endDate);
            }

            if (dateRange.start && dateRange.end) {
                query.createdAt = {
                    $gte: dateRange.start.toDate(),
                    $lte: dateRange.end.toDate()
                };
            }

            const salesData = await Orders.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        },
                        totalSales: { $sum: '$totalAmount' },
                        ordersCount: { $sum: 1 },
                        discountTotal: {
                            $sum: {
                                $cond: [
                                    { $ne: ['$coupon', null] },
                                    { $subtract: ['$totalAmount', { $multiply: ['$totalAmount', { $divide: ['$discount', 100] }] }] },
                                    0
                                ]
                            }
                        }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            const summary = {
                totalSales: salesData.reduce((acc, curr) => acc + curr.totalSales, 0),
                totalOrders: salesData.reduce((acc, curr) => acc + curr.ordersCount, 0),
                totalDiscount: salesData.reduce((acc, curr) => acc + curr.discountTotal, 0),
                averageOrderValue: salesData.length ? 
                    salesData.reduce((acc, curr) => acc + curr.totalSales, 0) / salesData.reduce((acc, curr) => acc + curr.ordersCount, 0) : 0
            };

            res.json({ salesData, summary });

        } catch (error) {
            console.error('Sales report error:', error);
            res.status(500).json({ error: 'Error generating sales report' });
        }
    },

    async downloadSalesReport(req, res) {
        try {
            const { format } = req.query;
            const salesData = await this.getSalesReport(req, res);

            if (format === 'pdf') {
                const doc = new PDFDocument();
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
                
                doc.pipe(res);
                
                // Add PDF content
                doc.fontSize(20).text('Sales Report', { align: 'center' });
                doc.moveDown();
                
                salesData.salesData.forEach(data => {
                    doc.fontSize(12).text(`Date: ${data._id}`);
                    doc.fontSize(10)
                        .text(`Sales: $${data.totalSales.toFixed(2)}`)
                        .text(`Orders: ${data.ordersCount}`)
                        .text(`Discount: $${data.discountTotal.toFixed(2)}`);
                    doc.moveDown();
                });
                
                doc.end();

            } else if (format === 'excel') {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Sales Report');

                // Add headers
                worksheet.columns = [
                    { header: 'Date', key: 'date' },
                    { header: 'Sales', key: 'sales' },
                    { header: 'Orders', key: 'orders' },
                    { header: 'Discount', key: 'discount' }
                ];

                // Add data
                salesData.salesData.forEach(data => {
                    worksheet.addRow({
                        date: data._id,
                        sales: data.totalSales,
                        orders: data.ordersCount,
                        discount: data.discountTotal
                    });
                });

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

                await workbook.xlsx.write(res);
                res.end();
            }

        } catch (error) {
            console.error('Download report error:', error);
            res.status(500).json({ error: 'Error downloading report' });
        }
    }
};