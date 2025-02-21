import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { CustomEmote } from '../../types/emotes';

export function EmotesPanel() {
  const [emotes, setEmotes] = useState<CustomEmote[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEmote, setNewEmote] = useState<Partial<CustomEmote>>({
    name: '',
    url: ''
  });

  useEffect(() => {
    // Load emotes when component mounts
    chrome.storage.local.get(['customEmotes'], (data) => {
      if (data.customEmotes) {
        setEmotes(data.customEmotes);
      }
    });
  }, []);

  const handleSaveEmote = async () => {
    if (!newEmote.name || !newEmote.url) return;

    const emote: CustomEmote = {
      id: crypto.randomUUID(),
      name: newEmote.name,
      url: newEmote.url
    };

    const updatedEmotes = [...emotes, emote];
    setEmotes(updatedEmotes);
    await chrome.storage.local.set({ customEmotes: updatedEmotes });
    setIsDialogOpen(false);
    setNewEmote({ name: '', url: '' });
  };

  const handleDeleteEmote = async (id: string) => {
    const updatedEmotes = emotes.filter(emote => emote.id !== id);
    setEmotes(updatedEmotes);
    await chrome.storage.local.set({ customEmotes: updatedEmotes });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Custom Emotes</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
        >
          Add Emote
        </Button>
      </Box>

      <Grid container spacing={2}>
        {emotes.map((emote) => (
          <Grid item xs={4} key={emote.id}>
            <Box
              sx={{
                p: 1,
                border: '1px solid #ccc',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <img src={emote.url} alt={emote.name} style={{ maxHeight: 32 }} />
              <Box sx={{ ml: 1, flex: 1 }}>{emote.name}</Box>
              <IconButton
                size="small"
                onClick={() => handleDeleteEmote(emote.id)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Add Custom Emote</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Emote Name"
            fullWidth
            value={newEmote.name}
            onChange={(e) => setNewEmote({ ...newEmote, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Emote URL"
            fullWidth
            value={newEmote.url}
            onChange={(e) => setNewEmote({ ...newEmote, url: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEmote} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 