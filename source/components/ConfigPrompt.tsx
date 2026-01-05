import React from 'react';
import {Box, Text, useApp} from 'ink';
import SelectInput from 'ink-select-input';
import {PALETTE} from '../lib/theme.js';

type Props = {
	onCreateConfig: () => void;
};

type Item = {
	label: string;
	value: 'yes' | 'no';
};

const items: Item[] = [
	{label: 'Yes, create a starter config', value: 'yes'},
	{label: 'No, exit', value: 'no'},
];

export default function ConfigPrompt({onCreateConfig}: Props) {
	const {exit} = useApp();

	const handleSelect = (item: Item) => {
		if (item.value === 'yes') {
			onCreateConfig();
		} else {
			exit();
		}
	};

	return (
		<Box flexDirection="column" gap={1}>
			<Text color={PALETTE.yellow}>
				No habits.yaml config found in .foam/ directory.
			</Text>
			<Text>Would you like to create one?</Text>
			<SelectInput items={items} onSelect={handleSelect} />
		</Box>
	);
}
