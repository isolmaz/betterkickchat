import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { MessageFilter } from '../../types/chat';

export function FiltersPanel() {
  const [filters, setFilters] = useState<MessageFilter[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<MessageFilter>>({
    type: 'keyword',
    action: 'hide',
    isEnabled: true,
  });

  useEffect(() => {
    // Load filters when component mounts
    chrome.storage.local.get(['filters'], (data) => {
      if (data.filters) {
        setFilters(data.filters);
      }
    });
  }, []);

  const handleSaveFilter = async () => {
    if (!newFilter.pattern) return;

    const filter: MessageFilter = {
      id: crypto.randomUUID(),
      type: newFilter.type || 'keyword',
      pattern: newFilter.pattern,
      action: newFilter.action || 'hide',
      isEnabled: newFilter.isEnabled ?? true,
      color: newFilter.action === 'highlight' ? newFilter.color : undefined,
    };

    const updatedFilters = [...filters, filter];
    setFilters(updatedFilters);
    await chrome.storage.local.set({ filters: updatedFilters });
    setIsDialogOpen(false);
    setNewFilter({
      type: 'keyword',
      action: 'hide',
      isEnabled: true,
    });
  };

  const handleDeleteFilter = async (id: string) => {
    const updatedFilters = filters.filter(filter => filter.id !== id);
    setFilters(updatedFilters);
    await chrome.storage.local.set({ filters: updatedFilters });
  };

  const handleToggleFilter = async (id: string) => {
    const updatedFilters = filters.map(filter =>
      filter.id === id ? { ...filter, isEnabled: !filter.isEnabled } : filter
    );
    setFilters(updatedFilters);
    await chrome.storage.local.set({ filters: updatedFilters });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
        >
          Add Filter
        </Button>
      </Box>

      <List>
        {filters.map((filter) => (
          <ListItem key={filter.id}>
            <ListItemText
              primary={filter.pattern}
              secondary={`${filter.type} - ${filter.action}`}
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={filter.isEnabled}
                onChange={() => handleToggleFilter(filter.id)}
              />
              <IconButton
                edge="end"
                onClick={() => handleDeleteFilter(filter.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Add New Filter</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Filter Type</InputLabel>
            <Select
              value={newFilter.type || 'keyword'}
              label="Filter Type"
              onChange={(e) => setNewFilter({ ...newFilter, type: e.target.value as MessageFilter['type'] })}
            >
              <MenuItem value="keyword">Keyword</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="regex">Regular Expression</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Pattern"
            value={newFilter.pattern || ''}
            onChange={(e) => setNewFilter({ ...newFilter, pattern: e.target.value })}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Action</InputLabel>
            <Select
              value={newFilter.action || 'hide'}
              label="Action"
              onChange={(e) => setNewFilter({ ...newFilter, action: e.target.value as MessageFilter['action'] })}
            >
              <MenuItem value="hide">Hide</MenuItem>
              <MenuItem value="highlight">Highlight</MenuItem>
              <MenuItem value="notify">Notify</MenuItem>
            </Select>
          </FormControl>

          {newFilter.action === 'highlight' && (
            <TextField
              fullWidth
              margin="normal"
              label="Highlight Color"
              type="color"
              value={newFilter.color || '#ffeb3b'}
              onChange={(e) => setNewFilter({ ...newFilter, color: e.target.value })}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveFilter} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 