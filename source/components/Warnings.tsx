import { Box, Static, Text } from 'ink';
import React from 'react';
import { PALETTE } from '../lib/palette.js';

type Props = {
	warnings: string[];
};

export default function Warnings({warnings}: Props) {
	if (warnings.length === 0) {
		return null;
	}

	return (
		<Static items={warnings}>
			{(warning, index) => (
				<Box key={index}>
					<Text color={PALETTE.yellow}>{warning}</Text>
				</Box>
			)}
		</Static>
	);
}
