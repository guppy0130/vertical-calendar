const visit = (darkAppearance) => {
  cy.visit('/', {
    onBeforeLoad(win) {
      cy.stub(win, 'matchMedia').withArgs('(prefers-color-scheme: dark)').returns({
        matches: darkAppearance,
      })
    }
  })
};


describe("Styling", () => {
  context("Dark Mode", () => {
    it('Visits the site and loads dark mode', () => {
      visit(true);
      cy.get('#dark').should('be.checked');
    });

    it('Highlights the current date', () => {
      cy.get('.currentDate').should('have.css', 'background-color', 'rgba(255, 255, 255, 0.1)');
    });

    it('Switches to light mode', () => {
      cy.get('.settings > :nth-child(1)').click();
      cy.contains('Theme').click();
      cy.get('#light').check();
    });
  });

  context("Light Mode", () => {
    it('Visits the site and loads light mode', () => {
      visit(false);
      cy.get('#light').should('be.checked');
    });

    it('Highlights the current date', () => {
      cy.get('.currentDate').should('have.css', 'background-color', 'rgba(0, 0, 0, 0.06)');
    });

    it('Switches to dark mode', () => {
      cy.get('.settings > :nth-child(1)').click();
      cy.contains('Theme').click();
      cy.get('#dark').check();
    });
  });

  context("Other styling checks", () => {
    // this is skipped because it evaluates the css, so it's not 3em but 48px
    it.skip('Has the correct vertical padding', () => {
      cy.get('.wrapper').should('have.css', 'padding', '3em 10%');
      cy.get('body').should('have.css', 'padding', '1em');
    });
  });
});

describe("Date logic/display", () => {
  context('Leap Year', () => {
    beforeEach(() => {
      // Feb 1 2020, 12p
      cy.clock(Date.UTC(2020, 1, 1, 12), ['Date']);
      visit(true);
    });

    it('Has all the right calendar entries', () => {
      cy.get('.month').should('have.text', 'Feb');
      cy.contains("Valentine's Day");
    });

    it('Shows all calendar entries', () => {
      // this is the bottomost element
      cy.contains('29').should('be.visible');
    });

    it('Should not extend beyond 30th grid-row', () => {
      cy.contains('30').should('not.exist');
      cy.contains('29').should('not.have.css', 'grid-row', '30 / auto')
    })
  });
});
