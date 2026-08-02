import { MARKS } from './Pictogram';
import { games } from '../../arcade/games/gameRegistry';

describe('the drawn marks', () => {
  it('covers every machine in the arcade', () => {
    // The list is driven off the registry, so a game added there without a
    // mark here would quietly render a nameless gap in the column.
    const missing = games.filter((game) => !MARKS[game.id]).map((game) => game.id);
    expect(missing).toEqual([]);
  });

  it('draws nothing that is not in the arcade', () => {
    const ids = new Set(games.map((game) => game.id));
    expect(Object.keys(MARKS).filter((id) => !ids.has(id))).toEqual([]);
  });
});
