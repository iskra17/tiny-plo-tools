import { useState, useEffect, useCallback } from 'react';
import { api, type StrategyAction, type TreeNode, type Simulation } from '../api/client';

export function useSimulations() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSimulations().then(setSimulations).finally(() => setLoading(false));
  }, []);

  return { simulations, loading };
}

export function useStrategy(simId: number | null, hand: string, actionPrefix: string) {
  const [actions, setActions] = useState<StrategyAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!simId || !hand) {
      setActions([]);
      return;
    }

    setLoading(true);
    setError(null);

    api
      .getStrategy(simId, hand, actionPrefix)
      .then((res) => setActions(res.actions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [simId, hand, actionPrefix]);

  return { actions, loading, error };
}

export function useAvailableActions(simId: number | null, actionPrefix: string) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!simId) {
      setNodes([]);
      return;
    }

    setLoading(true);
    api
      .getAvailableActions(simId, actionPrefix)
      .then(setNodes)
      .finally(() => setLoading(false));
  }, [simId, actionPrefix]);

  return { nodes, loading };
}

export function useActionTree(_simId: number | null) {
  const [actionCodes, setActionCodes] = useState<string[]>([]);

  const actionPrefix = actionCodes.join('.');

  const pushAction = useCallback((code: string) => {
    setActionCodes((prev) => [...prev, code]);
  }, []);

  const popAction = useCallback(() => {
    setActionCodes((prev) => prev.slice(0, -1));
  }, []);

  const reset = useCallback(() => {
    setActionCodes([]);
  }, []);

  return { actionCodes, actionPrefix, pushAction, popAction, reset };
}
