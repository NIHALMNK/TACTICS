const Orders = require('../../models/orderModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

async function generateSalesData(query) {
    const salesData = await Orders.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                totalSales: { $sum: '$totalAmount' },
                ordersCount: { $sum: 1 },
                grossSales: { $sum: { $add: ['$totalAmount', '$totalDiscount'] } },
                couponDiscount: { $sum: '$couponDiscount' },
                regularDiscount: { $sum: '$discount' },
                totalDiscount: { $sum: '$totalDiscount' }
            }
        },
        { $sort: { '_id': 1 } },
        {
            $project: {
                _id: 1,
                totalSales: 1,
                ordersCount: 1,
                grossSales: 1,
                couponDiscount: 1,
                regularDiscount: 1,
                totalDiscount: 1,
                discountPercentage: {
                    $multiply: [
                        { 
                            $divide: [
                                '$totalDiscount',
                                { $max: ['$grossSales', 1] }
                            ]
                        },
                        100
                    ]
                }
            }
        }
    ]);

    const summary = {
        totalSales: salesData.reduce((acc, curr) => acc + curr.totalSales, 0),
        grossSales: salesData.reduce((acc, curr) => acc + curr.grossSales, 0),
        totalOrders: salesData.reduce((acc, curr) => acc + curr.ordersCount, 0),
        couponDiscount: salesData.reduce((acc, curr) => acc + curr.couponDiscount, 0),
        regularDiscount: salesData.reduce((acc, curr) => acc + curr.regularDiscount, 0),
        totalDiscount: salesData.reduce((acc, curr) => acc + curr.totalDiscount, 0),
        averageOrderValue: salesData.length ? 
            salesData.reduce((acc, curr) => acc + curr.totalSales, 0) / 
            salesData.reduce((acc, curr) => acc + curr.ordersCount, 0) : 0,
        averageDiscount: salesData.length ?
            salesData.reduce((acc, curr) => acc + curr.totalDiscount, 0) /
            salesData.reduce((acc, curr) => acc + curr.ordersCount, 0) : 0
    };

    return { salesData, summary };
}

module.exports = {
    async loadDashboard(req, res) {
        try {
            if (!req.session.admin) {
                return res.status(200).redirect('/admin/login');
            }

            // Get overall stats
            const totalOrders = await Orders.countDocuments();
            
            // Get revenue excluding cancelled orders
            const revenueStats = await Orders.aggregate([
                { 
                    $match: { 
                        status: { $ne: 'Cancelled' } 
                    } 
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalAmount' },
                        grossRevenue: { $sum: { $add: ['$totalAmount', '$totalDiscount'] } },
                        totalDiscount: { $sum: '$totalDiscount' }
                    }
                }
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
                        grossRevenue: { $sum: { $add: ['$totalAmount', '$totalDiscount'] } },
                        orders: { $sum: 1 },
                        totalDiscount: { $sum: '$totalDiscount' }
                    }
                }
            ]);

            const revenue = revenueStats[0]?.totalRevenue || 0;
            const grossRevenue = revenueStats[0]?.grossRevenue || 0;
            const totalDiscount = revenueStats[0]?.totalDiscount || 0;
            const todayRevenue = todayStats[0]?.revenue || 0;
            const todayGrossRevenue = todayStats[0]?.grossRevenue || 0;
            const todayDiscount = todayStats[0]?.totalDiscount || 0;
            const todayOrders = todayStats[0]?.orders || 0;

            return res.status(200).render('admin/dashboard', {
                admin: req.session.admin,
                stats: {
                    totalOrders,
                    totalRevenue: revenue,
                    grossRevenue,
                    totalDiscount,
                    todayRevenue,
                    todayGrossRevenue,
                    todayDiscount,
                    todayOrders,
                    discountPercentage: grossRevenue ? ((totalDiscount / grossRevenue) * 100).toFixed(1) : 0,
                    todayDiscountPercentage: todayGrossRevenue ? ((todayDiscount / todayGrossRevenue) * 100).toFixed(1) : 0
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

            const result = await generateSalesData(query);
            res.json(result);

        } catch (error) {
            console.error('Sales report error:', error);
            res.status(500).json({ error: 'Error generating sales report' });
        }
    },

    async downloadSalesReport(req, res) {
        try {
            const { format, startDate, endDate, period } = req.query;
            let query = { status: { $ne: 'Cancelled' } };
            let dateRange = {};

            if (period) {
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

            const { salesData, summary } = await generateSalesData(query);

            if (format === 'pdf') {
                // Set correct headers for PDF
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=sales-report-${moment().format('YYYY-MM-DD')}.pdf`);

                const doc = new PDFDocument();
                doc.pipe(res);

                // Add title and header
                doc.fontSize(20).text('Sales Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Period: ${dateRange.start.format('YYYY-MM-DD')} to ${dateRange.end.format('YYYY-MM-DD')}`, { align: 'center' });
                doc.moveDown();

                // Add summary section
                doc.fontSize(14).text('Summary', { underline: true });
                doc.fontSize(10);
                doc.text(`Total Orders: ${summary.totalOrders}`);
                doc.text(`Gross Sales: $${summary.grossSales.toFixed(2)}`);
                doc.text(`Total Discount: $${summary.totalDiscount.toFixed(2)}`);
                doc.text(`Net Sales: $${summary.totalSales.toFixed(2)}`);
                doc.moveDown();

                // Add table headers
                const tableTop = 250;
                const tableHeaders = ['Date', 'Orders', 'Gross Sales', 'Discount', 'Net Sales'];
                let currentTop = tableTop;

                // Draw table headers
                doc.fontSize(10);
                tableHeaders.forEach((header, i) => {
                    doc.text(header, 50 + (i * 100), currentTop);
                });

                // Draw table rows
                currentTop += 20;
                salesData.forEach((data) => {
                    if (currentTop > 700) { // Check if we need a new page
                        doc.addPage();
                        currentTop = 50;
                    }

                    doc.text(data._id, 50, currentTop);
                    doc.text(data.ordersCount.toString(), 150, currentTop);
                    doc.text(`$${data.grossSales.toFixed(2)}`, 250, currentTop);
                    doc.text(`$${data.totalDiscount.toFixed(2)}`, 350, currentTop);
                    doc.text(`$${data.totalSales.toFixed(2)}`, 450, currentTop);
                    
                    currentTop += 20;
                });

                doc.end();

            } else if (format === 'excel') {
                // Set correct headers for Excel
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=sales-report-${moment().format('YYYY-MM-DD')}.xlsx`);

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Sales Report');

                // Style for headers
                const headerStyle = {
                    font: { bold: true },
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE0E0E0' }
                    }
                };

                // Add title
                worksheet.mergeCells('A1:E1');
                worksheet.getCell('A1').value = 'Sales Report';
                worksheet.getCell('A1').font = { size: 16, bold: true };
                worksheet.getCell('A1').alignment = { horizontal: 'center' };

                // Add date range
                worksheet.mergeCells('A2:E2');
                worksheet.getCell('A2').value = `Period: ${dateRange.start.format('YYYY-MM-DD')} to ${dateRange.end.format('YYYY-MM-DD')}`;
                worksheet.getCell('A2').alignment = { horizontal: 'center' };

                // Add summary section
                worksheet.addRow(['Summary']);
                worksheet.addRow(['Total Orders', summary.totalOrders]);
                worksheet.addRow(['Gross Sales', `$${summary.grossSales.toFixed(2)}`]);
                worksheet.addRow(['Total Discount', `$${summary.totalDiscount.toFixed(2)}`]);
                worksheet.addRow(['Net Sales', `$${summary.totalSales.toFixed(2)}`]);
                worksheet.addRow([]);

                // Add table headers
                const headers = ['Date', 'Orders', 'Gross Sales', 'Total Discount', 'Net Sales'];
                worksheet.addRow(headers);
                worksheet.getRow(7).font = { bold: true };

                // Add data rows
                salesData.forEach(data => {
                    worksheet.addRow([
                        data._id,
                        data.ordersCount,
                        `$${data.grossSales.toFixed(2)}`,
                        `$${data.totalDiscount.toFixed(2)}`,
                        `$${data.totalSales.toFixed(2)}`
                    ]);
                });

                // Style columns
                worksheet.columns.forEach(column => {
                    column.width = 15;
                });

                // Write to response
                await workbook.xlsx.write(res);
                res.end();
            }

        } catch (error) {
            console.error('Download report error:', error);
            res.status(500).json({ error: 'Error downloading report' });
        }
    },
};