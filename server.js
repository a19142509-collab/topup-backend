const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

app.post('/api/topup', async (req, res) => {
    const { playerId, itemId, itemName, price, paymentMethod } = req.body;

    if (!playerId || !itemId) {
        return res.status(400).json({ status: 'error', message: 'Data tidak lengkap' });
    }

    const orderId = `SIM-${Date.now()}`;

    const { data, error } = await supabase
        .from('transactions')
        .insert([{
            order_id: orderId,
            player_id: playerId,
            item_id: itemId,
            item_name: itemName,
            price: price,
            payment_method: paymentMethod,
            status: 'pending'
        }])
        .select();

    if (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }

    await supabase
        .from('transactions')
        .update({ status: 'success' })
        .eq('order_id', orderId);

    res.json({
        status: 'success',
        orderId: orderId,
        message: 'Simulasi top-up berhasil (diamond tidak benar-benar dikirim)',
        data: data[0]
    });
});

app.get('/api/status/:orderId', async (req, res) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('order_id', req.params.orderId)
        .single();

    if (error) {
        return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan' });
    }

    res.json({ status: 'success', data });
});

module.exports = app;
