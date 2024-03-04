import { Argument, program } from 'commander';
import CharacterGenerator from './generator.js';
import Game from './game.js';

export default {
	run() {
		program
			.name('Guess My Gig! CLI')
			.description('Manage and run instances of the Guess My Gig! game')

		program.command('generate')
			.description(`Generate one or more characters for use in future runs of GMG. Valid character types are 'moderator', 'panelist', or 'guest'`)
			.addArgument(new Argument('<character_type>', 'Character type to generate').choices(['moderator', 'panelist', 'guest']))
			.addArgument(new Argument('[repeat]', 'Number of characters to generate').default(1))
			.action(CharacterGenerator.Generate);
		
		program.command('play')
			.description(`Creates and runs a new game, if enough characters have been generated`)
			.action(Game.New);

		program.parse();
	}
}
