/**
 * Seating Layout Data Generator for Ground Floor & First Floor Auditorium Map
 * Incorporates explicit row-by-row vector configuration for First Floor Left Wing (Rows 1H to 1A),
 * Right Wing, and Center sections, along with Ground Floor and VIP Lounge.
 */

function generateVenueLayout() {
  const seats = [];

  // Helper to push a seat conforming to exact schema specification
  const addSeat = ({
    seatId,
    displayLabel,
    row,
    seatNumber,
    position,
    side = 'CENTER',
    floor = 'FIRST_FLOOR',
    section = 'Ground Floor',
    category,
    block,
    x,
    y,
    rotation = 0,
    type = 'standard',
    couchGroup = null
  }) => {
    seats.push({
      seatId,
      displayLabel: displayLabel || `${row}-${seatNumber}`,
      row,
      seat_number: Number(seatNumber),
      seatNumber: Number(seatNumber),
      position: position !== undefined ? Number(position) : Number(seatNumber),
      side,
      floor,
      section,
      category,
      block,
      x_position: Math.round(x * 10) / 10,
      y_position: Math.round(y * 10) / 10,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      rotation: Math.round(rotation * 10) / 10,
      seat_type: type,
      type,
      couchGroup,
      status: 'available'
    });
  };

  // =========================================================================
  // 1. FIRST FLOOR — LEFT WING (EXPLICIT ROW-BY-ROW VECTOR CONFIGURATION)
  // Rows 1H down to 1A. 1A is closest to Silver boundary, 1H is upper/back.
  // Each row is a single continuous seat block: Seats [1..12], NO central aisle inside.
  // =========================================================================
  const firstFloorLeftRowConfigs = [
    { row: '1H', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], originX: 200, originY: 110, rotation: -22, seatSpacing: 22 },
    { row: '1G', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], originX: 185, originY: 140, rotation: -20, seatSpacing: 22 },
    { row: '1F', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], originX: 170, originY: 170, rotation: -18, seatSpacing: 22 },
    { row: '1E', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], originX: 155, originY: 200, rotation: -16, seatSpacing: 22 },
    { row: '1D', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], originX: 140, originY: 230, rotation: -14, seatSpacing: 22 },
    { row: '1C', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], originX: 125, originY: 260, rotation: -12, seatSpacing: 22 },
    { row: '1B', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], originX: 110, originY: 290, rotation: -10, seatSpacing: 22 },
    { row: '1A', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], originX: 95,  originY: 320, rotation: -8,  seatSpacing: 22 }
  ];

  firstFloorLeftRowConfigs.forEach((config) => {
    config.seats.forEach((seatNum, idx) => {
      const rad = (config.rotation * Math.PI) / 180;
      const offsetX = idx * config.seatSpacing;
      const x = config.originX + offsetX * Math.cos(rad);
      const y = config.originY + offsetX * Math.sin(rad);

      addSeat({
        seatId: `FFL-${config.row}-${seatNum}`,
        displayLabel: `${config.row}-${seatNum}`,
        row: config.row,
        seatNumber: seatNum,
        position: seatNum,
        side: 'LEFT',
        floor: 'FIRST_FLOOR',
        section: 'FIRST_FLOOR_LEFT',
        category: 'Silver',
        block: 'First-Floor-Left',
        x,
        y,
        rotation: config.rotation
      });
    });
  });

  // =========================================================================
  // 2. FIRST FLOOR — CENTER SECTION (EXPLICIT ROW-BY-ROW VECTOR & GROUP CONFIGURATION)
  // Central Vertical Aisle dividing each row into LEFT and RIGHT seat blocks.
  // Internal gaps inside Row 1G (between 18 & 19) and Row 1B (between 14 & 15).
  // Seat numbers continue seamlessly across all gaps without restarting.
  // =========================================================================
  const firstFloorCenterRowConfigs = [
    {
      row: '1G',
      leftGroups: [
        [13, 14, 15, 16, 17, 18],
        [19, 20, 21, 22, 23, 24]
      ],
      rightGroups: [
        [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]
      ],
      originY: 140
    },
    {
      row: '1F',
      leftGroups: [
        [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
      ],
      rightGroups: [
        [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38]
      ],
      originY: 170
    },
    {
      row: '1E',
      leftGroups: [
        [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
      ],
      rightGroups: [
        [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]
      ],
      originY: 200
    },
    {
      row: '1D',
      leftGroups: [
        [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
      ],
      rightGroups: [
        [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]
      ],
      originY: 230
    },
    {
      row: '1C',
      leftGroups: [
        [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
      ],
      rightGroups: [
        [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34]
      ],
      originY: 260
    },
    {
      row: '1B',
      leftGroups: [
        [13, 14],
        [15, 16, 17, 18, 19, 20, 21, 22]
      ],
      rightGroups: [
        [23, 24, 25, 26, 27, 28, 29, 30, 31, 32]
      ],
      originY: 290
    },
    {
      row: '1A',
      leftGroups: [
        [13, 14, 15, 16, 17, 18, 19]
      ],
      rightGroups: [
        [20, 21, 22, 23, 24, 25, 26, 27, 28]
      ],
      originY: 320
    }
  ];

  const firstFloorCenterX = 850;
  const firstFloorCentralAisleGap = 44;
  const internalGroupGap = 16;
  const seatGapXCenter = 22;

  firstFloorCenterRowConfigs.forEach((config) => {
    const y = config.originY;

    // --- LEFT BLOCK POSITIONING ---
    let leftTotalWidth = 0;
    config.leftGroups.forEach((group, gIdx) => {
      leftTotalWidth += group.length * seatGapXCenter;
      if (gIdx < config.leftGroups.length - 1) {
        leftTotalWidth += internalGroupGap;
      }
    });

    const leftStartX = firstFloorCenterX - (firstFloorCentralAisleGap / 2) - leftTotalWidth;

    let currentXLeft = leftStartX;
    let globalSeatPosLeft = 1;
    config.leftGroups.forEach((group) => {
      group.forEach((seatNum) => {
        addSeat({
          seatId: `FFC-${config.row}-${seatNum}`,
          displayLabel: `${config.row}-${seatNum}`,
          row: config.row,
          seatNumber: seatNum,
          position: globalSeatPosLeft++,
          side: 'LEFT',
          floor: 'FIRST_FLOOR',
          section: 'FIRST_FLOOR_CENTER',
          category: 'Silver',
          block: 'First-Floor-Center-Left',
          x: currentXLeft,
          y,
          rotation: 0
        });
        currentXLeft += seatGapXCenter;
      });
      currentXLeft += internalGroupGap;
    });

    // --- RIGHT BLOCK POSITIONING ---
    let currentXRight = firstFloorCenterX + (firstFloorCentralAisleGap / 2) + seatGapXCenter;
    let globalSeatPosRight = 1;
    config.rightGroups.forEach((group) => {
      group.forEach((seatNum) => {
        addSeat({
          seatId: `FFC-${config.row}-${seatNum}`,
          displayLabel: `${config.row}-${seatNum}`,
          row: config.row,
          seatNumber: seatNum,
          position: globalSeatPosRight++,
          side: 'RIGHT',
          floor: 'FIRST_FLOOR',
          section: 'FIRST_FLOOR_CENTER',
          category: 'Silver',
          block: 'First-Floor-Center-Right',
          x: currentXRight,
          y,
          rotation: 0
        });
        currentXRight += seatGapXCenter;
      });
      currentXRight += internalGroupGap;
    });
  });

  // =========================================================================
  // 3. FIRST FLOOR — RIGHT WING (ALIGNED HORIZONTAL ROW CONFIGURATION)
  // Rows 1G down to 1A cleanly aligned with First Floor Center rows across the aisle.
  // Generous 30px vertical separation with 0 collisions and comfortable 22px seat spacing.
  // =========================================================================
  const firstFloorRightRowConfigs = [
    {
      row: '1G',
      groups: [
        [36, 37, 38, 39, 40],
        [41, 42, 43, 44, 45]
      ],
      originX: 1260,
      originY: 140,
      rotation: 0,
      seatSpacing: 22,
      internalGroupGap: 16
    },
    {
      row: '1F',
      groups: [
        [39],
        [40, 41, 42, 43, 44, 45, 46, 47, 48, 49]
      ],
      originX: 1260,
      originY: 170,
      rotation: 0,
      seatSpacing: 22,
      internalGroupGap: 16
    },
    {
      row: '1E',
      groups: [
        [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48]
      ],
      originX: 1260,
      originY: 200,
      rotation: 0,
      seatSpacing: 22,
      internalGroupGap: 0
    },
    {
      row: '1D',
      groups: [
        [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48]
      ],
      originX: 1260,
      originY: 230,
      rotation: 0,
      seatSpacing: 22,
      internalGroupGap: 0
    },
    {
      row: '1C',
      groups: [
        [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]
      ],
      originX: 1260,
      originY: 260,
      rotation: 0,
      seatSpacing: 22,
      internalGroupGap: 0
    },
    {
      row: '1B',
      groups: [
        [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44]
      ],
      originX: 1260,
      originY: 290,
      rotation: 0,
      seatSpacing: 22,
      internalGroupGap: 0
    },
    {
      row: '1A',
      groups: [
        [29, 30, 31, 32, 33, 34, 35, 36, 37, 38]
      ],
      originX: 1260,
      originY: 320,
      rotation: 0,
      seatSpacing: 22,
      internalGroupGap: 0
    }
  ];

  firstFloorRightRowConfigs.forEach((config) => {
    const rad = (config.rotation * Math.PI) / 180;
    let currentIdx = 0;
    let globalSeatPos = 1;

    config.groups.forEach((group, gIdx) => {
      group.forEach((seatNum) => {
        const offsetDistance = currentIdx * config.seatSpacing;
        const x = config.originX + offsetDistance * Math.cos(rad);
        const y = config.originY + offsetDistance * Math.sin(rad);

        addSeat({
          seatId: `FFR-${config.row}-${seatNum}`,
          displayLabel: `${config.row}-${seatNum}`,
          row: config.row,
          seatNumber: seatNum,
          position: globalSeatPos++,
          side: 'RIGHT',
          floor: 'FIRST_FLOOR',
          section: 'FIRST_FLOOR_RIGHT',
          category: 'Silver',
          block: 'First-Floor-Right',
          x,
          y,
          rotation: config.rotation
        });

        currentIdx++;
      });

      if (gIdx < config.groups.length - 1) {
        currentIdx += (config.internalGroupGap / config.seatSpacing);
      }
    });
  });

  // =========================================================================
  // GROUND FLOOR SECTION (Y offset starts at 380px)
  // =========================================================================
  const groundYOffset = 260;
  const rowGapY = 28;
  const seatGapX = 22;

  const allRowsOrdered = ['Q', 'P', 'O', 'N', 'M', 'L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];

  // 4. GROUND FLOOR LEFT BLOCK (ANGLED -18°)
  const leftAngle = -18;
  const leftRad = (leftAngle * Math.PI) / 180;
  const leftOriginX = 80;
  const leftOriginY = 195 + groundYOffset;

  allRowsOrdered.forEach((r, rIdx) => {
    const isPlatinum = ['A', 'B', 'C', 'D', 'E'].includes(r);
    const category = isPlatinum ? 'Platinum' : 'Gold';
    const seatCount = 12;
    const efGap = rIdx >= 12 ? 25 : 0;

    for (let s = 1; s <= seatCount; s++) {
      const offsetX = (s - 1) * seatGapX;
      const offsetY = rIdx * rowGapY + efGap;

      const rotX = offsetX * Math.cos(leftRad) - offsetY * Math.sin(leftRad);
      const rotY = offsetX * Math.sin(leftRad) + offsetY * Math.cos(leftRad);

      addSeat({
        seatId: `L-${r}-${s}`,
        displayLabel: `${r}${s}`,
        row: r,
        seatNumber: s,
        position: s,
        side: 'LEFT',
        section: 'Ground Floor',
        category,
        block: 'Left',
        x: leftOriginX + rotX,
        y: leftOriginY + rotY,
        rotation: leftAngle
      });
    }
  });

  // 5. GROUND FLOOR CENTER SECTION
  const centerX = 850;
  const centralAisleGap = 40;

  const centerGoldSplitRows = [
    { row: 'O', left: [13, 25], right: [26, 37], y: 120 + groundYOffset },
    { row: 'N', left: [13, 27], right: [28, 41], y: 148 + groundYOffset },
    { row: 'M', left: [13, 26], right: [27, 39], y: 176 + groundYOffset },
    { row: 'L', left: [13, 25], right: [26, 37], y: 204 + groundYOffset },
    { row: 'K', left: [13, 24], right: [25, 35], y: 232 + groundYOffset },
    { row: 'J', left: [13, 23], right: [24, 33], y: 260 + groundYOffset },
    { row: 'I', left: [13, 22], right: [23, 31], y: 288 + groundYOffset },
    { row: 'H', left: [13, 20], right: [21, 28], y: 316 + groundYOffset },
    { row: 'G', left: [13, 20], right: [21, 28], y: 344 + groundYOffset },
    { row: 'F', left: [13, 19], right: [20, 26], y: 372 + groundYOffset }
  ];

  centerGoldSplitRows.forEach((cg) => {
    // Center-Left Sub-block
    const leftStart = cg.left[0];
    const leftEnd = cg.left[1];
    const leftCount = leftEnd - leftStart + 1;
    for (let i = 0; i < leftCount; i++) {
      const sNum = leftStart + i;
      const x = centerX - (centralAisleGap / 2) - (leftCount - i) * 22;
      addSeat({
        seatId: `CL-${cg.row}-${sNum}`,
        displayLabel: `${cg.row}${sNum}`,
        row: cg.row,
        seatNumber: sNum,
        position: i + 1,
        side: 'LEFT',
        section: 'Ground Floor',
        category: 'Gold',
        block: 'Center-Left',
        x,
        y: cg.y,
        rotation: 0
      });
    }

    // Center-Right Sub-block
    const rightStart = cg.right[0];
    const rightEnd = cg.right[1];
    const rightCount = rightEnd - rightStart + 1;
    for (let i = 0; i < rightCount; i++) {
      const sNum = rightStart + i;
      const x = centerX + (centralAisleGap / 2) + (i + 1) * 22;
      addSeat({
        seatId: `CR-${cg.row}-${sNum}`,
        displayLabel: `${cg.row}${sNum}`,
        row: cg.row,
        seatNumber: sNum,
        position: i + 1,
        side: 'RIGHT',
        section: 'Ground Floor',
        category: 'Gold',
        block: 'Center-Right',
        x,
        y: cg.y,
        rotation: 0
      });
    }
  });

  // Center Platinum Curved Centered Rows: E, D, C, B
  const centerPlatinumRows = [
    { row: 'E', start: 13, end: 25, y: 460 + groundYOffset },
    { row: 'D', start: 13, end: 23, y: 488 + groundYOffset },
    { row: 'C', start: 13, end: 21, y: 516 + groundYOffset },
    { row: 'B', start: 13, end: 19, y: 544 + groundYOffset }
  ];

  centerPlatinumRows.forEach((cp) => {
    const totalSeats = cp.end - cp.start + 1;
    const centerIdx = (totalSeats - 1) / 2;

    for (let i = 0; i < totalSeats; i++) {
      const sNum = cp.start + i;
      const offsetIndex = i - centerIdx;
      const arcX = centerX + offsetIndex * 24;
      const arcY = cp.y + Math.pow(offsetIndex, 2) * 0.9;

      addSeat({
        seatId: `CF-${cp.row}-${sNum}`,
        displayLabel: `${cp.row}${sNum}`,
        row: cp.row,
        seatNumber: sNum,
        position: i + 1,
        side: 'CENTER',
        section: 'Ground Floor',
        category: 'Platinum',
        block: 'Center-Front',
        x: arcX,
        y: arcY,
        rotation: offsetIndex * 1.8
      });
    }
  });

  // 6. GROUND FLOOR RIGHT BLOCK (ANGLED +18°)
  const rightAngle = 18;
  const rightRad = (rightAngle * Math.PI) / 180;
  const rightOriginX = 1240;
  const rightOriginY = 120 + groundYOffset;

  const rightGroundRowMappings = {
    Q: [
      { seat: 13, position: 1 }, { seat: 14, position: 2 }, { seat: 15, position: 3 },
      { seat: 16, position: 4 }, { seat: 17, position: 5 },
      { seat: 18, position: 7 }, { seat: 19, position: 8 }, { seat: 20, position: 9 },
      { seat: 21, position: 10 }, { seat: 22, position: 11 }, { seat: 23, position: 12 }
    ],
    P: [
      { seat: 13, position: 1 }, { seat: 14, position: 2 }, { seat: 15, position: 3 }, { seat: 16, position: 4 },
      { seat: 17, position: 5 }, { seat: 18, position: 6 }, { seat: 19, position: 7 }, { seat: 20, position: 8 },
      { seat: 21, position: 9 }, { seat: 22, position: 10 }, { seat: 23, position: 11 }, { seat: 24, position: 12 }
    ],
    O: [
      { seat: 38, position: 1 }, { seat: 39, position: 2 }, { seat: 40, position: 3 }, { seat: 41, position: 4 },
      { seat: 42, position: 5 }, { seat: 43, position: 6 }, { seat: 44, position: 7 }, { seat: 45, position: 8 },
      { seat: 46, position: 9 }, { seat: 47, position: 10 }, { seat: 48, position: 11 }, { seat: 49, position: 12 }
    ],
    N: [
      { seat: 42, position: 1 }, { seat: 43, position: 2 }, { seat: 44, position: 3 }, { seat: 45, position: 4 },
      { seat: 46, position: 5 }, { seat: 47, position: 6 }, { seat: 48, position: 7 }, { seat: 49, position: 8 },
      { seat: 50, position: 9 }, { seat: 51, position: 10 }, { seat: 52, position: 11 }, { seat: 53, position: 12 }
    ],
    M: [
      { seat: 40, position: 1 }, { seat: 41, position: 2 }, { seat: 42, position: 3 }, { seat: 43, position: 4 },
      { seat: 44, position: 5 }, { seat: 45, position: 6 }, { seat: 46, position: 7 }, { seat: 47, position: 8 },
      { seat: 48, position: 9 }, { seat: 49, position: 10 }, { seat: 50, position: 11 }, { seat: 51, position: 12 }
    ],
    L: [
      { seat: 38, position: 1 }, { seat: 39, position: 2 }, { seat: 40, position: 3 }, { seat: 41, position: 4 },
      { seat: 42, position: 5 }, { seat: 43, position: 6 }, { seat: 44, position: 7 }, { seat: 45, position: 8 },
      { seat: 46, position: 9 }, { seat: 47, position: 10 }, { seat: 48, position: 11 }, { seat: 49, position: 12 }
    ],
    K: [
      { seat: 36, position: 1 },
      { seat: 37, position: 3 }, { seat: 38, position: 4 }, { seat: 39, position: 5 }, { seat: 40, position: 6 },
      { seat: 41, position: 7 }, { seat: 42, position: 8 }, { seat: 43, position: 9 }, { seat: 44, position: 10 },
      { seat: 45, position: 11 }, { seat: 46, position: 12 }
    ],
    J: [
      { seat: 34, position: 1 }, { seat: 35, position: 2 }, { seat: 36, position: 3 }, { seat: 37, position: 4 },
      { seat: 38, position: 5 }, { seat: 39, position: 6 }, { seat: 40, position: 7 }, { seat: 41, position: 8 },
      { seat: 42, position: 9 }, { seat: 43, position: 10 }, { seat: 44, position: 11 }, { seat: 45, position: 12 }
    ],
    I: [
      { seat: 32, position: 1 }, { seat: 33, position: 2 }, { seat: 34, position: 3 }, { seat: 35, position: 4 },
      { seat: 36, position: 5 }, { seat: 37, position: 6 }, { seat: 38, position: 7 }, { seat: 39, position: 8 },
      { seat: 40, position: 9 }, { seat: 41, position: 10 }, { seat: 42, position: 11 }, { seat: 43, position: 12 }
    ],
    H: [
      { seat: 29, position: 1 }, { seat: 30, position: 2 }, { seat: 31, position: 3 }, { seat: 32, position: 4 },
      { seat: 33, position: 5 }, { seat: 34, position: 6 }, { seat: 35, position: 7 }, { seat: 36, position: 8 },
      { seat: 37, position: 9 }, { seat: 38, position: 10 }, { seat: 39, position: 11 }, { seat: 40, position: 12 }
    ],
    G: [
      { seat: 29, position: 1 }, { seat: 30, position: 2 }, { seat: 31, position: 3 }, { seat: 32, position: 4 },
      { seat: 33, position: 5 }, { seat: 34, position: 6 }, { seat: 35, position: 7 }, { seat: 36, position: 8 },
      { seat: 37, position: 9 }, { seat: 38, position: 10 }, { seat: 39, position: 11 }, { seat: 40, position: 12 }
    ],
    F: [
      { seat: 27, position: 1 }, { seat: 28, position: 2 }, { seat: 29, position: 3 }, { seat: 30, position: 4 },
      { seat: 31, position: 5 }, { seat: 32, position: 6 }, { seat: 33, position: 7 }, { seat: 34, position: 8 },
      { seat: 35, position: 9 }, { seat: 36, position: 10 }, { seat: 37, position: 11 }, { seat: 38, position: 12 }
    ],
    E: [
      { seat: 26, position: 1 }, { seat: 27, position: 2 }, { seat: 28, position: 3 }, { seat: 29, position: 4 },
      { seat: 30, position: 5 }, { seat: 31, position: 6 }, { seat: 32, position: 7 }, { seat: 33, position: 8 },
      { seat: 34, position: 9 }, { seat: 35, position: 10 }, { seat: 36, position: 11 }, { seat: 37, position: 12 }
    ],
    D: [
      { seat: 24, position: 1 }, { seat: 25, position: 2 }, { seat: 26, position: 3 }, { seat: 27, position: 4 },
      { seat: 28, position: 5 }, { seat: 29, position: 6 }, { seat: 30, position: 7 }, { seat: 31, position: 8 },
      { seat: 32, position: 9 }, { seat: 33, position: 10 }, { seat: 34, position: 11 }, { seat: 35, position: 12 }
    ],
    C: [
      { seat: 22, position: 1 }, { seat: 23, position: 2 }, { seat: 24, position: 3 }, { seat: 25, position: 4 },
      { seat: 26, position: 5 }, { seat: 27, position: 6 }, { seat: 28, position: 7 }, { seat: 29, position: 8 },
      { seat: 30, position: 9 }, { seat: 31, position: 10 }, { seat: 32, position: 11 }, { seat: 33, position: 12 }
    ],
    B: [
      { seat: 20, position: 1 }, { seat: 21, position: 2 }, { seat: 22, position: 3 }, { seat: 23, position: 4 },
      { seat: 24, position: 5 }, { seat: 25, position: 6 }, { seat: 26, position: 7 }, { seat: 27, position: 8 },
      { seat: 28, position: 9 }, { seat: 29, position: 10 }, { seat: 30, position: 11 }, { seat: 31, position: 12 }
    ],
    A: [
      { seat: 13, position: 1 }, { seat: 14, position: 2 }, { seat: 15, position: 3 }, { seat: 16, position: 4 },
      { seat: 17, position: 5 }, { seat: 18, position: 6 }, { seat: 19, position: 7 }, { seat: 20, position: 8 },
      { seat: 21, position: 9 }, { seat: 22, position: 10 }, { seat: 23, position: 11 }, { seat: 24, position: 12 }
    ]
  };

  allRowsOrdered.forEach((r, rIdx) => {
    const isPlatinum = ['A', 'B', 'C', 'D', 'E'].includes(r);
    const category = isPlatinum ? 'Platinum' : 'Gold';
    const rowSeats = rightGroundRowMappings[r] || [];
    const efGap = rIdx >= 12 ? 25 : 0;

    rowSeats.forEach((item) => {
      const offsetX = (item.position - 1) * seatGapX;
      const offsetY = rIdx * rowGapY + efGap;

      const rotX = offsetX * Math.cos(rightRad) - offsetY * Math.sin(rightRad);
      const rotY = offsetX * Math.sin(rightRad) + offsetY * Math.cos(rightRad);

      addSeat({
        seatId: `R-${r}-${item.seat}`,
        displayLabel: `${r}${item.seat}`,
        row: r,
        seatNumber: item.seat,
        position: item.position,
        side: 'RIGHT',
        section: 'Ground Floor',
        category,
        block: 'Right',
        x: rightOriginX + rotX,
        y: rightOriginY + rotY,
        rotation: rightAngle
      });
    });
  });

  // 7. VIP LOUNGE SOFAS (ROW V)
  const rIdxV = 17;
  const efGapV = 25;
  const sofaGap = 28;

  const leftVipGroups = [
    { group: 1, seats: [1, 2, 3] },
    { group: 2, seats: [4, 5, 6] },
    { group: 3, seats: [7, 8, 9] }
  ];

  leftVipGroups.forEach((g, groupIdx) => {
    g.seats.forEach((sNum, seatIdxInGroup) => {
      const seatIndexInRow = groupIdx * 3 + seatIdxInGroup;
      const offsetX = seatIndexInRow * seatGapX + groupIdx * sofaGap;
      const offsetY = rIdxV * rowGapY + efGapV;

      const rotX = offsetX * Math.cos(leftRad) - offsetY * Math.sin(leftRad);
      const rotY = offsetX * Math.sin(leftRad) + offsetY * Math.cos(leftRad);

      addSeat({
        seatId: `V-${sNum}`,
        displayLabel: `V${sNum}`,
        row: 'V',
        seatNumber: sNum,
        position: sNum,
        side: 'LEFT',
        section: 'Ground Floor',
        category: 'VIP Lounge',
        block: 'VIP-Left',
        x: leftOriginX + rotX,
        y: leftOriginY + rotY,
        rotation: leftAngle,
        type: 'sofa',
        couchGroup: g.group
      });
    });
  });

  const rightVipGroups = [
    { group: 4, seats: [10, 11, 12], startPosition: 0 },
    { group: 5, seats: [13, 14, 15], startPosition: 9 }
  ];

  rightVipGroups.forEach((g) => {
    g.seats.forEach((sNum, seatIdxInGroup) => {
      const seatIndexInRow = g.startPosition + seatIdxInGroup;
      const offsetX = seatIndexInRow * seatGapX;
      const offsetY = rIdxV * rowGapY + efGapV;

      const rotX = offsetX * Math.cos(rightRad) - offsetY * Math.sin(rightRad);
      const rotY = offsetX * Math.sin(rightRad) + offsetY * Math.cos(rightRad);

      addSeat({
        seatId: `V-${sNum}`,
        displayLabel: `V${sNum}`,
        row: 'V',
        seatNumber: sNum,
        position: sNum,
        side: 'RIGHT',
        section: 'Ground Floor',
        category: 'VIP Lounge',
        block: 'VIP-Right',
        x: rightOriginX + rotX,
        y: rightOriginY + rotY,
        rotation: rightAngle,
        type: 'sofa',
        couchGroup: g.group
      });
    });
  });

  return {
    venueId: 'ground-floor-main',
    name: 'Main Auditorium Seating',
    dimensions: { width: 1750, height: 1100 },
    seats
  };
}

module.exports = { generateVenueLayout };
