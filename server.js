const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3004;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/recommendations', async (req, res) => {
  try {
    console.log('Fetching buyback recommendations');
    const { data, error } = await supabase
      .from('buyback2')
      .select('nft_id, vendor_id')
      .eq('status', 'completed')
      .limit(10);
    if (error) throw error;

    const recommendations = await Promise.all(data.map(async (item) => {
      const { data: nftData, error: nftError } = await supabase
        .from('nfts')
        .select('title, description')
        .eq('id', item.nft_id)
        .single();
      if (nftError) throw nftError;
      const email = nftData?.description ? nftData.description.split(' | ').pop() : item.vendor_id;
      return { nft_id: item.nft_id, title: nftData.title, vendor_email: email };
    }));
    console.log('Recommendations:', recommendations);
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
