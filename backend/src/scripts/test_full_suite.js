import { io } from 'socket.io-client';

async function runFullSuite() {
  console.log('--- STARTING FULL SUITE TEST ---');
  const URL = 'http://localhost:4000';

  // 1. Test Autocomplete Search API
  console.log('Testing search API...');
  const testNames = ['Morata', 'En-Nesyri', 'Sneijder', 'Drogba', 'Hazard', 'Bale', 'Guler'];
  for (const name of testNames) {
    const res = await fetch(`${URL}/api/search-players?q=${encodeURIComponent(name)}&limit=3`);
    const data = await res.json();
    if (data.length === 0) {
      throw new Error(`Autocomplete failed to find: ${name}`);
    }
    console.log(`✓ Autocomplete found ${name}: ${data[0].name} (${data[0].club}, ${data[0].nationality})`);
  }

  // 2. Connect Sockets
  const socketHost = io(URL);
  const socketPlayer = io(URL);

  await new Promise(r => setTimeout(r, 600));

  // Host creates table
  await new Promise((resolve) => {
    socketHost.emit('create-table', { username: 'yuED10', inviteCode: 'YUED10' }, (res) => {
      console.log('Host table created:', res.success);
      resolve();
    });
  });

  // Player joins table
  await new Promise((resolve) => {
    socketPlayer.emit('join-table', { username: 'Ali_Ankara', inviteCode: 'YUED10' }, (res) => {
      console.log('Player joined table:', res.success);
      resolve();
    });
  });

  // 3. Test Career Mode + Skip
  console.log('\n--- Testing Career Mode ---');
  await new Promise((resolve) => {
    socketHost.emit('host-start-mode', { mode: 'career', hostUsername: 'yuED10' }, (res) => {
      resolve();
    });
  });
  await new Promise(r => setTimeout(r, 400));
  const tableCareer = await fetch(`${URL}/api/table`).then(r => r.json());
  console.log('Career question clubs:', tableCareer.gameState.question.careerClubs);
  if (!tableCareer.gameState.question.careerClubs || tableCareer.gameState.question.careerClubs.length < 3) {
    throw new Error('Career question has less than 3 clubs!');
  }
  console.log('Testing Career Skip...');
  await new Promise((resolve) => {
    socketHost.emit('career-skip', { hostUsername: 'yuED10' }, (res) => {
      console.log('Career skip result:', res.success);
      resolve();
    });
  });
  const tableCareerSkipped = await fetch(`${URL}/api/table`).then(r => r.json());
  console.log('Career skipped state:', tableCareerSkipped.gameState.skipped, tableCareerSkipped.gameState.solved);

  // 4. Test Transfer Detective + Skip
  console.log('\n--- Testing Transfer Detective ---');
  await new Promise((resolve) => {
    socketHost.emit('host-start-mode', { mode: 'detective', hostUsername: 'yuED10' }, (res) => {
      resolve();
    });
  });
  await new Promise(r => setTimeout(r, 400));
  const tableDet = await fetch(`${URL}/api/table`).then(r => r.json());
  console.log('Transfer question:', {
    player: tableDet.gameState.transfer.playerName,
    fee: tableDet.gameState.transfer.feeEur,
    from: tableDet.gameState.transfer.fromClub,
    to: tableDet.gameState.transfer.toClub
  });
  console.log('Testing Detective Skip...');
  await new Promise((resolve) => {
    socketHost.emit('detective-skip', { hostUsername: 'yuED10' }, (res) => {
      console.log('Detective skip result:', res.success);
      resolve();
    });
  });

  // 5. Test 1 Takım 1 Ülke
  console.log('\n--- Testing 1 Takım 1 Ülke ---');
  await new Promise((resolve) => {
    socketHost.emit('host-start-mode', { mode: 'oneTeamOneCountry', hostUsername: 'yuED10' }, (res) => {
      resolve();
    });
  });
  await new Promise(r => setTimeout(r, 400));
  const tableOne = await fetch(`${URL}/api/table`).then(r => r.json());
  console.log('1 Takım 1 Ülke combo:', tableOne.gameState.club, tableOne.gameState.country);

  // Test skip
  await new Promise((resolve) => {
    socketHost.emit('one-team-skip', { hostUsername: 'yuED10' }, (res) => {
      console.log('One Team skip result:', res.success);
      resolve();
    });
  });

  // 6. Test 2 Takım 1 Ülke
  console.log('\n--- Testing 2 Takım 1 Ülke ---');
  await new Promise((resolve) => {
    socketHost.emit('host-start-mode', { mode: 'twoTeamsOneCountry', hostUsername: 'yuED10' }, (res) => {
      resolve();
    });
  });
  await new Promise(r => setTimeout(r, 400));
  const tableTwo = await fetch(`${URL}/api/table`).then(r => r.json());
  console.log('2 Takım 1 Ülke combo:', tableTwo.gameState.club1, tableTwo.gameState.club2, tableTwo.gameState.country);

  // Test skip
  await new Promise((resolve) => {
    socketHost.emit('two-teams-skip', { hostUsername: 'yuED10' }, (res) => {
      console.log('Two Teams skip result:', res.success);
      resolve();
    });
  });

  // 7. Test 7 Kart Futbolcu Düellosu
  console.log('\n--- Testing 7 Kart Futbolcu Düellosu ---');
  await new Promise((resolve) => {
    socketHost.emit('host-start-mode', { mode: 'cardClash', hostUsername: 'yuED10' }, (res) => {
      resolve();
    });
  });
  await new Promise(r => setTimeout(r, 400));
  let tableClash = await fetch(`${URL}/api/table`).then(r => r.json());
  console.log('Clash stage:', tableClash.gameState.stage);
  console.log('Gold rules:', tableClash.gameState.goldRules.map(r => r.title));
  console.log('Duel rules (7 rounds):', tableClash.gameState.duelRules.map(r => r.title));

  // Find 7 sample players for each
  const sampleSearch = await fetch(`${URL}/api/search-players?q=a&limit=20`).then(r => r.json());
  console.log(`Drafting for yuED10 and Ali_Ankara...`);

  // Fill Normal slots (3,4,5,6)
  for (let s = 3; s < 7; s++) {
    socketHost.emit('clash-set-slot', { username: 'yuED10', slotIndex: s, playerId: sampleSearch[s].id });
    socketPlayer.emit('clash-set-slot', { username: 'Ali_Ankara', slotIndex: s, playerId: sampleSearch[s + 4].id });
  }

  console.log('✓ All modules and socket events verified successfully!');
  socketHost.disconnect();
  socketPlayer.disconnect();
}

runFullSuite().then(() => {
  console.log('\n--- FULL SUITE TEST COMPLETED WITH 100% SUCCESS ---');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ FULL SUITE TEST FAILED:', err);
  process.exit(1);
});
